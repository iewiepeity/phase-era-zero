import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  buildNpcPrompt,
  detectMessageIntent,
  calcTrustIncrement,
  detectRevealedClue,
  DEFAULT_PLAYER_STATS,
  type NpcState,
} from "@/lib/npc-engine";
import { getNpc } from "@/lib/npc-registry";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── 型別 ──────────────────────────────────────────────────────
type ChatMessage = {
  role: "user" | "npc";
  content: string;
};

// ── Supabase 輔助 ─────────────────────────────────────────────

async function ensureSession(guestId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const db = createServerSupabase();
    const { data: existing } = await db
      .from("game_sessions")
      .select("id")
      .eq("player_name", guestId)
      .eq("status", "active")
      .maybeSingle();
    if (existing) return existing.id;

    const { data: created, error } = await db
      .from("game_sessions")
      .insert({
        player_name: guestId,
        killer_id: "phase2_placeholder",
        motive_direction: "A",
        status: "active",
      })
      .select("id")
      .single();
    if (error) { console.warn("[chat] create session:", error.message); return null; }
    return created.id;
  } catch (e) { console.warn("[chat] ensureSession:", e); return null; }
}

async function getNpcStateFromDb(sessionId: string, npcId: string): Promise<NpcState> {
  const fallback: NpcState = { selfAffinity: 0, sharedClues: [], isExposed: false, lastSeenAct: 0 };
  if (!isSupabaseConfigured()) return fallback;
  try {
    const db = createServerSupabase();
    const { data } = await db
      .from("npc_states")
      .select("trust_level, clues_revealed, conversation_count")
      .eq("session_id", sessionId)
      .eq("npc_id", npcId)
      .maybeSingle();
    if (!data) return fallback;
    return {
      selfAffinity: data.trust_level ?? 0,
      sharedClues: data.clues_revealed ?? [],
      isExposed: false,
      lastSeenAct: 0,
    };
  } catch { return fallback; }
}

async function updateNpcStateInDb(
  sessionId: string,
  npcId: string,
  trustDelta: number,
  newlyRevealedClue: string | null
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const db = createServerSupabase();
    const { data: existing } = await db
      .from("npc_states")
      .select("id, trust_level, clues_revealed, conversation_count")
      .eq("session_id", sessionId)
      .eq("npc_id", npcId)
      .maybeSingle();

    const newTrust = Math.min(100, Math.max(-100, (existing?.trust_level ?? 0) + trustDelta));
    const revealed: string[] = existing?.clues_revealed ?? [];
    if (newlyRevealedClue && !revealed.includes(newlyRevealedClue)) {
      revealed.push(newlyRevealedClue);
    }

    if (existing) {
      await db.from("npc_states").update({
        trust_level: newTrust,
        clues_revealed: revealed,
        conversation_count: (existing.conversation_count ?? 0) + 1,
      }).eq("id", existing.id);
    } else {
      await db.from("npc_states").insert({
        session_id: sessionId,
        npc_id: npcId,
        trust_level: newTrust,
        clues_revealed: revealed,
        conversation_count: 1,
      });
    }
  } catch (e) { console.warn("[chat] updateNpcState:", e); }
}

async function saveMessages(
  sessionId: string,
  npcId: string,
  userContent: string,
  npcContent: string
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const db = createServerSupabase();
    await db.from("chat_messages").insert([
      { session_id: sessionId, npc_id: npcId, role: "user",      content: userContent },
      { session_id: sessionId, npc_id: npcId, role: "assistant",  content: npcContent },
    ]);
  } catch (e) { console.warn("[chat] saveMessages:", e); }
}

// ── GET /api/chat — 載入對話歷史 ──────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const npcId = searchParams.get("npcId") ?? "chen_jie";

  if (!sessionId || !isSupabaseConfigured()) {
    return NextResponse.json({ messages: [], npcState: null });
  }

  try {
    const db = createServerSupabase();
    const [{ data: messages }, { data: npcStateRow }] = await Promise.all([
      db
        .from("chat_messages")
        .select("role, content, created_at")
        .eq("session_id", sessionId)
        .eq("npc_id", npcId)
        .order("created_at", { ascending: true }),
      db
        .from("npc_states")
        .select("trust_level, clues_revealed, conversation_count")
        .eq("session_id", sessionId)
        .eq("npc_id", npcId)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      messages: messages ?? [],
      npcState: npcStateRow ?? null,
    });
  } catch (e) {
    console.error("[GET /api/chat]", e);
    return NextResponse.json({ messages: [], npcState: null });
  }
}

// ── POST /api/chat — 傳送訊息 ────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      sessionId,
      guestId,
      npcId = "chen_jie",
      currentAct = 1,
      playerRoute = "A",
    } = (await req.json()) as {
      messages: ChatMessage[];
      sessionId?: string;
      guestId?: string;
      npcId?: string;
      currentAct?: number;
      playerRoute?: "A" | "B";
    };

    // 1. 確保有 session
    const resolvedSessionId =
      sessionId ?? (guestId ? await ensureSession(guestId) : null);

    // 2. 取得 NPC 狀態（含信任度）
    const npcState = resolvedSessionId
      ? await getNpcStateFromDb(resolvedSessionId, npcId)
      : { selfAffinity: 0, sharedClues: [], isExposed: false, lastSeenAct: 0 };

    // 3. 組裝 System Prompt
    const npc = getNpc(npcId);
    if (!npc) return NextResponse.json({ error: `Unknown NPC: ${npcId}` }, { status: 400 });

    const systemPrompt = buildNpcPrompt({
      npcId,
      currentAct,
      playerRoute,
      playerStats: DEFAULT_PLAYER_STATS,
      npcState,
    });

    // 4. 呼叫 Gemini
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const reply = result.response.text();

    // 5. 計算信任增量
    const intent = detectMessageIntent(lastMessage.content);
    const trustDelta = calcTrustIncrement(npc, intent);

    // 6. 偵測是否揭露線索
    const { filterAvailableClues } = await import("@/lib/npc-engine");
    const available = filterAvailableClues(npc.clues, npcState, DEFAULT_PLAYER_STATS, currentAct);
    const revealedClueId = detectRevealedClue(reply, available);

    // 7. 更新 DB（非同步，不阻塞回應）
    if (resolvedSessionId) {
      saveMessages(resolvedSessionId, npcId, lastMessage.content, reply);
      updateNpcStateInDb(resolvedSessionId, npcId, trustDelta, revealedClueId);
    }

    return NextResponse.json({
      reply,
      sessionId: resolvedSessionId,
      trustDelta,
      newTrustLevel: Math.min(100, npcState.selfAffinity + trustDelta),
      revealedClueId,
    });
  } catch (err) {
    console.error("[POST /api/chat]", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    // Gemini rate limit
    if (msg.includes("429") || msg.includes("quota")) {
      return NextResponse.json({ error: "rate_limit", message: "Gemini API 達到請求限制，請稍後再試。" }, { status: 429 });
    }
    return NextResponse.json({ error: "server_error", message: "伺服器暫時出了點問題。" }, { status: 500 });
  }
}
