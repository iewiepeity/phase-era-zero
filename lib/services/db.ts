/**
 * 資料庫服務層 — 所有 Supabase CRUD 操作集中於此
 * API routes 不應直接呼叫 Supabase，改透過這裡的函式操作。
 */

import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { NpcState } from "@/lib/npc-engine";
import type { KillerId, MotiveDirection, CaseConfig } from "@/lib/case-config";
import type { DbChatMessage, DbNpcState } from "@/lib/types";

// ── Session ────────────────────────────────────────────────────

/**
 * 確保 guestId 有一個活躍 session，若無則建立。
 * 用於 Phase 2 Demo 模式（無 game/new 流程時的後備）。
 */
export async function ensureSession(guestId: string): Promise<string | null> {
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
        player_name:      guestId,
        killer_id:        "phase2_placeholder",
        motive_direction: "A",
        status:           "active",
      })
      .select("id")
      .single();

    if (error) {
      console.warn("[db] ensureSession:", error.message);
      return null;
    }
    return created.id;
  } catch (e) {
    console.warn("[db] ensureSession:", e);
    return null;
  }
}

/**
 * 廢棄 guestId 名下所有活躍 session（開新局前呼叫）。
 */
export async function abandonActiveSessions(guestId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const db = createServerSupabase();
    await db
      .from("game_sessions")
      .update({ status: "abandoned" })
      .eq("player_name", guestId)
      .eq("status", "active");
  } catch (e) {
    console.warn("[db] abandonActiveSessions:", e);
  }
}

/**
 * 建立新遊戲 session，回傳 sessionId。
 */
export async function createGameSession(params: {
  guestId:          string;
  killerId:         KillerId;
  motiveDirection:  MotiveDirection;
}): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const db = createServerSupabase();
    const { data, error } = await db
      .from("game_sessions")
      .insert({
        player_name:      params.guestId,
        killer_id:        params.killerId,
        motive_direction: params.motiveDirection,
        status:           "active",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[db] createGameSession:", error.message);
      return null;
    }
    return data.id;
  } catch (e) {
    console.error("[db] createGameSession:", e);
    return null;
  }
}

/**
 * 取得 session 的正確答案（killer + motive）。
 */
export async function getGameSession(sessionId: string): Promise<{
  id:               string;
  killer_id:        string;
  motive_direction: string;
  player_name:      string;
  status:           string;
} | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const db = createServerSupabase();
    const { data, error } = await db
      .from("game_sessions")
      .select("id, killer_id, motive_direction, player_name, status")
      .eq("id", sessionId)
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * 寫入玩家身份選擇（normal / phase2）。
 * 在 identity 頁選完後呼叫。
 */
export async function updatePlayerIdentity(
  sessionId: string,
  identity:  "normal" | "phase2",
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const db = createServerSupabase();
    await db
      .from("game_sessions")
      .update({ player_identity: identity })
      .eq("id", sessionId);
  } catch (e) {
    console.warn("[db] updatePlayerIdentity:", e);
  }
}

/**
 * 標記 session 為已完成，寫入結局與分數。
 */
export async function completeGameSession(
  sessionId: string,
  result:    "win" | "lose",
  score:     number,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const db = createServerSupabase();
    await db
      .from("game_sessions")
      .update({
        status:   "completed",
        result,
        score,
        ended_at: new Date().toISOString(),
      })
      .eq("id", sessionId);
  } catch (e) {
    console.warn("[db] completeGameSession:", e);
  }
}

/**
 * 從 game_sessions 重建最小 CaseConfig（供 NPC 動態線索使用）。
 */
export async function getCaseConfig(sessionId: string): Promise<CaseConfig | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const db = createServerSupabase();
    const { data } = await db
      .from("game_sessions")
      .select("killer_id, motive_direction, created_at")
      .eq("id", sessionId)
      .maybeSingle();

    if (!data?.killer_id || !data?.motive_direction) return null;

    return {
      killerId:        data.killer_id as KillerId,
      motiveDirection: data.motive_direction as MotiveDirection,
      relationship:    "R1",
      elements:        ["D1"],
      truthString:     "",
      seed:            0,
      generatedAt:     data.created_at ?? new Date().toISOString(),
    } satisfies CaseConfig;
  } catch {
    return null;
  }
}

// ── Player Progress ────────────────────────────────────────────

/**
 * 更新（或建立）玩家的整體進度統計。失敗不拋錯，靜默警告。
 */
export async function upsertPlayerProgress(
  playerName: string,
  correct:    boolean,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const db = createServerSupabase();
    const { data: progress } = await db
      .from("player_progress")
      .select("id, total_games, wins")
      .eq("player_name", playerName)
      .maybeSingle();

    if (progress) {
      await db
        .from("player_progress")
        .update({
          total_games: (progress.total_games ?? 0) + 1,
          wins:        (progress.wins ?? 0) + (correct ? 1 : 0),
          updated_at:  new Date().toISOString(),
        })
        .eq("id", progress.id);
    } else {
      await db.from("player_progress").insert({
        player_name: playerName,
        total_games: 1,
        wins:        correct ? 1 : 0,
      });
    }
  } catch (e) {
    console.warn("[db] upsertPlayerProgress:", e);
  }
}

// ── NPC State ──────────────────────────────────────────────────

/**
 * 從 DB 讀取 NPC 狀態（信任度、已揭露線索等）。
 */
export async function getNpcStateFromDb(
  sessionId: string,
  npcId:     string,
): Promise<NpcState> {
  const fallback: NpcState = {
    selfAffinity: 0,
    sharedClues:  [],
    isExposed:    false,
    lastSeenAct:  0,
  };
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
      selfAffinity: data.trust_level   ?? 0,
      sharedClues:  data.clues_revealed ?? [],
      isExposed:    false,
      lastSeenAct:  0,
    };
  } catch {
    return fallback;
  }
}

/**
 * 更新 NPC 狀態（信任度增量 + 新揭露線索）。Upsert 操作。
 */
export async function updateNpcState(
  sessionId:         string,
  npcId:             string,
  trustDelta:        number,
  newlyRevealedClue: string | null,
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

    const newTrust   = Math.min(100, Math.max(-100, (existing?.trust_level ?? 0) + trustDelta));
    const revealed   = [...(existing?.clues_revealed ?? [])];
    if (newlyRevealedClue && !revealed.includes(newlyRevealedClue)) {
      revealed.push(newlyRevealedClue);
    }

    if (existing) {
      await db
        .from("npc_states")
        .update({
          trust_level:        newTrust,
          clues_revealed:     revealed,
          conversation_count: (existing.conversation_count ?? 0) + 1,
        })
        .eq("id", existing.id);
    } else {
      await db.from("npc_states").insert({
        session_id:         sessionId,
        npc_id:             npcId,
        trust_level:        newTrust,
        clues_revealed:     revealed,
        conversation_count: 1,
      });
    }
  } catch (e) {
    console.warn("[db] updateNpcState:", e);
  }
}

// ── Chat Messages ──────────────────────────────────────────────

/**
 * 同時寫入玩家訊息與 NPC 回覆。
 */
export async function saveChatMessages(
  sessionId:  string,
  npcId:      string,
  userText:   string,
  npcReply:   string,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const db = createServerSupabase();
    await db.from("chat_messages").insert([
      { session_id: sessionId, npc_id: npcId, role: "user",      content: userText  },
      { session_id: sessionId, npc_id: npcId, role: "assistant",  content: npcReply  },
    ]);
  } catch (e) {
    console.warn("[db] saveChatMessages:", e);
  }
}

/**
 * 取得對話歷史與 NPC 狀態（GET /api/chat 使用）。
 */
export async function getChatHistory(
  sessionId: string,
  npcId:     string,
): Promise<{ messages: DbChatMessage[]; npcState: DbNpcState | null }> {
  if (!isSupabaseConfigured()) return { messages: [], npcState: null };

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

    return {
      messages:  (messages ?? []) as DbChatMessage[],
      npcState:  npcStateRow ?? null,
    };
  } catch (e) {
    console.error("[db] getChatHistory:", e);
    return { messages: [], npcState: null };
  }
}
