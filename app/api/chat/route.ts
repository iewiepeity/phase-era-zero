import { NextRequest, NextResponse } from "next/server";

// ── Rate Limit（每 session 每分鐘 20 則訊息）──────────────────
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX       = 20;

interface RateBucket {
  count:       number;
  windowStart: number;
}

// 使用 Map 儲存各 session 的請求計數（in-memory，重啟清除）
const rateLimitMap = new Map<string, RateBucket>();

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now    = Date.now();
  const bucket = rateLimitMap.get(key);

  if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (bucket.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - bucket.count };
}

import {
  ensureSession,
  getNpcStateFromDb,
  updateNpcState,
  saveChatMessages,
  getCaseConfig,
  getChatHistory,
  getTalkedNpcs,
  getCollectedClueIds,
  getInventoryItemIds,
  getSessionMeta,
  getCriticalClueCount,
  updateCurrentAct,
  addPlayerClue,
} from "@/lib/services/db";
import { callGeminiChat, isRateLimitError } from "@/lib/services/gemini";
import {
  buildNpcPrompt,
  buildConversationMemory,
  detectMessageIntent,
  calcTrustIncrement,
  detectRevealedClue,
  detectEvTrigger,
  filterAvailableClues,
  DEFAULT_PLAYER_STATS,
} from "@/lib/npc-engine";
import { getNpc } from "@/lib/npc-registry";
import { buildNpcClues } from "@/lib/random-engine";
import { getScene } from "@/lib/scene-config";
import { checkAndUnlockAchievements } from "@/lib/services/achievements";
import { checkActProgression } from "@/lib/services/act-progression";
import type { ChatMessage } from "@/lib/types";
import type { PlayerContext } from "@/lib/content/dialogue-triggers";

// ── GET /api/chat — 載入對話歷史 ──────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const npcId     = searchParams.get("npcId");

  if (!npcId) {
    return NextResponse.json({ error: "bad_request", message: "缺少必要參數：npcId" }, { status: 400 });
  }

  if (!sessionId) {
    return NextResponse.json({ messages: [], npcState: null });
  }

  const { messages, npcState } = await getChatHistory(sessionId, npcId);
  return NextResponse.json({ messages, npcState });
}

// ── POST /api/chat — 傳送訊息 ────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      sessionId,
      guestId,
      npcId,
      currentAct   = 1,
      playerRoute  = "A",
      currentSceneId,
      visitedScenes  = [],
      currentEv    = 0,
      alreadyUnlockedAchievements = [],
    } = (await req.json()) as {
      messages:       ChatMessage[];
      sessionId?:     string;
      guestId?:       string;
      npcId:          string;
      currentAct?:    number;
      playerRoute?:   "A" | "B";
      currentSceneId?: string;
      visitedScenes?: string[];
      currentEv?:     number;
      alreadyUnlockedAchievements?: string[];
    };

    if (!npcId) {
      return NextResponse.json({ error: "bad_request", message: "缺少必要欄位：npcId" }, { status: 400 });
    }

    // Rate limit — 以 sessionId 或 guestId 為 key
    const rlKey = sessionId ?? guestId ?? req.headers.get("x-forwarded-for") ?? "anon";
    const rl    = checkRateLimit(rlKey);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "rate_limit", message: "訊息發送過於頻繁，請稍後再試（每分鐘上限 20 則）。" },
        {
          status: 429,
          headers: { "Retry-After": "60", "X-RateLimit-Remaining": "0" },
        },
      );
    }

    // 1. 確保有 session
    const resolvedSessionId =
      sessionId ?? (guestId ? await ensureSession(guestId) : null);

    // 2. 取 NPC 定義
    const npc = getNpc(npcId);
    if (!npc) {
      return NextResponse.json({ error: `Unknown NPC: ${npcId}` }, { status: 400 });
    }

    // 3. 並行載入所有需要的資料
    const [npcState, historyData, talkedNpcs, clueIds, itemIds, sessionMeta] = await Promise.all([
      resolvedSessionId
        ? getNpcStateFromDb(resolvedSessionId, npcId)
        : Promise.resolve({ selfAffinity: 0, sharedClues: [], isExposed: false, lastSeenAct: 0 }),
      resolvedSessionId
        ? getChatHistory(resolvedSessionId, npcId)
        : Promise.resolve({ messages: [], npcState: null }),
      resolvedSessionId ? getTalkedNpcs(resolvedSessionId)       : Promise.resolve([]),
      resolvedSessionId ? getCollectedClueIds(resolvedSessionId) : Promise.resolve([]),
      resolvedSessionId ? getInventoryItemIds(resolvedSessionId) : Promise.resolve([]),
      resolvedSessionId ? getSessionMeta(resolvedSessionId)      : Promise.resolve(null),
    ]);

    // 取得難度與身份
    const difficulty     = sessionMeta?.difficulty     ?? "normal";
    const playerIdentity = sessionMeta?.playerIdentity ?? "normal";

    // 4. 取得所有 NPC 信任度（用於 trustLevel 觸發）
    const npcTrustLevels: Record<string, number> = { [npcId]: npcState.selfAffinity };

    // 5. 組建 PlayerContext（觸發條件判斷）
    const playerContext: PlayerContext = {
      talkedToNpcs:    talkedNpcs,
      visitedScenes:   visitedScenes,
      collectedItems:  itemIds,
      collectedClues:  clueIds,
      npcTrustLevels,
    };

    // 6. 建立對話記憶（前 N 輪對話）
    const historyMessages = historyData.messages as Array<{ role: string; content: string }>;
    const sceneName       = currentSceneId ? (getScene(currentSceneId)?.name ?? undefined) : undefined;
    const conversationMemory = buildConversationMemory(historyMessages, sceneName);

    // 7. 組裝 System Prompt（帶難度、EV、身份）
    const caseConfig   = resolvedSessionId ? await getCaseConfig(resolvedSessionId) : null;
    const dynamicClues = caseConfig ? buildNpcClues(npcId, caseConfig) : undefined;

    const evPlayerStats = {
      ...DEFAULT_PLAYER_STATS,
      ev: Math.min(100, Math.max(0, currentEv)),
    };

    const systemPrompt = buildNpcPrompt({
      npcId,
      currentAct,
      playerRoute,
      playerStats:         evPlayerStats,
      npcState,
      availableClues:      dynamicClues,
      currentSceneId,
      conversationMemory,
      playerContext,
      difficulty,
      playerIdentity:      playerIdentity as "normal" | "phase2",
      killerId:            caseConfig?.killerId,
      motiveDirection:     caseConfig?.motiveDirection,
    });

    // 8. 呼叫 Gemini
    const history     = messages.slice(0, -1);
    const lastMessage = messages[messages.length - 1];
    const reply       = await callGeminiChat(systemPrompt, history, lastMessage.content);

    // 9. 計算信任增量 + 偵測揭露線索
    const intent         = detectMessageIntent(lastMessage.content);
    const trustDelta     = calcTrustIncrement(npc, intent);
    const available      = filterAvailableClues(npc.clues, npcState, evPlayerStats, currentAct);
    const revealedClueId = detectRevealedClue(reply, available);

    // 10. EV 更新（Route B 才累積）
    const evDelta  = playerRoute === "B" ? detectEvTrigger(lastMessage.content) : 0;
    const newEv    = Math.min(100, Math.max(0, currentEv + evDelta));

    // 11. 自動把揭露線索寫入 player_clues（B1）
    let discoveredClue: { id: string; text: string } | null = null;
    if (revealedClueId && resolvedSessionId) {
      const clueObj = available.find((c) => c.id === revealedClueId);
      if (clueObj) {
        // 避免重複加入：若 clueIds 裡已有就跳過
        if (!clueIds.includes(revealedClueId)) {
          await addPlayerClue(resolvedSessionId, {
            clue_text:  clueObj.content,
            clue_type:  "npc",
            source_npc: npcId,
            category:   "general",
          });
          discoveredClue = { id: revealedClueId, text: clueObj.content };
        }
      }
    }

    // 12. 幕次推進檢查（A5）
    let actProgression: { advanced: boolean; newAct: number; unlockedScenes?: string[] } | null = null;
    if (resolvedSessionId && currentAct < 2) {
      const criticalCount = resolvedSessionId ? await getCriticalClueCount(resolvedSessionId) : clueIds.length;
      const updatedTalked = new Set([...talkedNpcs, npcId]);
      const progression   = checkActProgression(currentAct, criticalCount, updatedTalked.size);
      if (progression.advanced) {
        await updateCurrentAct(resolvedSessionId, progression.newAct);
        actProgression = {
          advanced:       true,
          newAct:         progression.newAct,
          unlockedScenes: progression.unlockedScenes,
        };
      }
    }

    // 13. 成就解鎖檢查（A2）
    const newAchievements = checkAndUnlockAchievements(
      {
        clueCount:       clueIds.length + (discoveredClue ? 1 : 0),
        talkedNpcCount:  talkedNpcs.length,
        visitedSceneIds: visitedScenes,
        npcTrustMap:     {
          ...npcTrustLevels,
          [npcId]: Math.min(100, npcState.selfAffinity + trustDelta),
        },
      },
      alreadyUnlockedAchievements,
    );

    // 14. 非同步寫入 DB（不阻塞回應）
    if (resolvedSessionId) {
      saveChatMessages(resolvedSessionId, npcId, lastMessage.content, reply);
      updateNpcState(resolvedSessionId, npcId, trustDelta, revealedClueId);
    }

    return NextResponse.json({
      reply,
      sessionId:    resolvedSessionId,
      trustDelta,
      newTrustLevel: Math.min(100, npcState.selfAffinity + trustDelta),
      revealedClueId,
      discoveredClue,
      newEv,
      actProgression,
      newAchievements: newAchievements.map((a) => ({ id: a.id, name: a.name })),
    });
  } catch (err) {
    console.error("[POST /api/chat]", err);
    if (isRateLimitError(err)) {
      return NextResponse.json(
        { error: "rate_limit", message: "Gemini API 達到請求限制，請稍後再試。" },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: "server_error", message: "伺服器暫時出了點問題。" },
      { status: 500 },
    );
  }
}
