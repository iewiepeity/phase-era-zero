import { NextRequest, NextResponse } from "next/server";
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
} from "@/lib/services/db";
import { callGeminiChat, isRateLimitError } from "@/lib/services/gemini";
import {
  buildNpcPrompt,
  buildConversationMemory,
  detectMessageIntent,
  calcTrustIncrement,
  detectRevealedClue,
  filterAvailableClues,
  DEFAULT_PLAYER_STATS,
} from "@/lib/npc-engine";
import { getNpc } from "@/lib/npc-registry";
import { buildNpcClues } from "@/lib/random-engine";
import { getScene } from "@/lib/scene-config";
import type { ChatMessage } from "@/lib/types";
import type { PlayerContext } from "@/lib/content/dialogue-triggers";

// ── GET /api/chat — 載入對話歷史 ──────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const npcId     = searchParams.get("npcId") ?? "chen_jie";

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
      npcId        = "chen_jie",
      currentAct   = 1,
      playerRoute  = "A",
      currentSceneId,
      visitedScenes  = [],
    } = (await req.json()) as {
      messages:       ChatMessage[];
      sessionId?:     string;
      guestId?:       string;
      npcId?:         string;
      currentAct?:    number;
      playerRoute?:   "A" | "B";
      currentSceneId?: string;
      visitedScenes?: string[];
    };

    // 1. 確保有 session
    const resolvedSessionId =
      sessionId ?? (guestId ? await ensureSession(guestId) : null);

    // 2. 取 NPC 定義
    const npc = getNpc(npcId);
    if (!npc) {
      return NextResponse.json({ error: `Unknown NPC: ${npcId}` }, { status: 400 });
    }

    // 3. 並行載入 NPC 狀態 + 對話歷史 + 玩家進度（用於觸發判斷）
    const [npcState, historyData, talkedNpcs, clueIds, itemIds] = await Promise.all([
      resolvedSessionId
        ? getNpcStateFromDb(resolvedSessionId, npcId)
        : Promise.resolve({ selfAffinity: 0, sharedClues: [], isExposed: false, lastSeenAct: 0 }),
      resolvedSessionId
        ? getChatHistory(resolvedSessionId, npcId)
        : Promise.resolve({ messages: [], npcState: null }),
      resolvedSessionId ? getTalkedNpcs(resolvedSessionId)       : Promise.resolve([]),
      resolvedSessionId ? getCollectedClueIds(resolvedSessionId) : Promise.resolve([]),
      resolvedSessionId ? getInventoryItemIds(resolvedSessionId) : Promise.resolve([]),
    ]);

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

    // 7. 組裝 System Prompt
    const caseConfig   = resolvedSessionId ? await getCaseConfig(resolvedSessionId) : null;
    const dynamicClues = caseConfig ? buildNpcClues(npcId, caseConfig) : undefined;

    const systemPrompt = buildNpcPrompt({
      npcId,
      currentAct,
      playerRoute,
      playerStats:         DEFAULT_PLAYER_STATS,
      npcState,
      availableClues:      dynamicClues,
      currentSceneId,
      conversationMemory,
      playerContext,
    });

    // 8. 呼叫 Gemini
    const history     = messages.slice(0, -1);
    const lastMessage = messages[messages.length - 1];
    const reply       = await callGeminiChat(systemPrompt, history, lastMessage.content);

    // 9. 計算信任增量 + 偵測揭露線索
    const intent         = detectMessageIntent(lastMessage.content);
    const trustDelta     = calcTrustIncrement(npc, intent);
    const available      = filterAvailableClues(npc.clues, npcState, DEFAULT_PLAYER_STATS, currentAct);
    const revealedClueId = detectRevealedClue(reply, available);

    // 10. 非同步寫入 DB（不阻塞回應）
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
