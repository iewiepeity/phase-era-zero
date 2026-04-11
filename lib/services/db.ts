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
  truthString?:     string;
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
        truth_string:     params.truthString ?? null,
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
  truth_string?:    string;
} | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const db = createServerSupabase();
    const { data, error } = await db
      .from("game_sessions")
      .select("id, killer_id, motive_direction, player_name, status, truth_string")
      .eq("id", sessionId)
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * 寫入難度選擇（easy / normal / hard，nightmare 對應到 hard）。
 * 在 difficulty 頁選完後呼叫。
 */
export async function updateDifficulty(
  sessionId: string,
  difficulty: "easy" | "normal" | "hard",
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const db = createServerSupabase();
    await db
      .from("game_sessions")
      .update({ difficulty })
      .eq("id", sessionId);
  } catch (e) {
    console.warn("[db] updateDifficulty:", e);
  }
}

/**
 * 更新當前幕次（1 或 2，對應 DB current_act INTEGER）。
 */
export async function updateCurrentAct(
  sessionId: string,
  act: number,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const db = createServerSupabase();
    await db
      .from("game_sessions")
      .update({ current_act: act })
      .eq("id", sessionId);
  } catch (e) {
    console.warn("[db] updateCurrentAct:", e);
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
      subMotiveId:     "A1",
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

// ── 道具欄 ────────────────────────────────────────────────────

export interface InventoryItem {
  id:           string;
  session_id:   string;
  item_id:      string;
  item_name:    string;
  description:  string;
  source_npc?:  string | null;
  source_scene?: string | null;
  icon?:        string | null;
  obtained_at:  string;
}

/**
 * 取得玩家道具欄。
 */
export async function getPlayerInventory(sessionId: string): Promise<InventoryItem[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const db = createServerSupabase();
    const { data, error } = await db
      .from("player_inventory")
      .select("*")
      .eq("session_id", sessionId)
      .order("obtained_at", { ascending: true });
    if (error) {
      console.warn("[db] getPlayerInventory:", error.message);
      return [];
    }
    return (data ?? []) as InventoryItem[];
  } catch (e) {
    console.warn("[db] getPlayerInventory:", e);
    return [];
  }
}

/**
 * 新增道具到玩家道具欄。
 */
export async function addInventoryItem(
  sessionId: string,
  item: {
    item_name:    string;
    description:  string;
    source_npc?:  string;
    source_scene?: string;
    icon?:        string;
  },
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const db = createServerSupabase();
    const item_id = `item_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    await db.from("player_inventory").insert({
      session_id:   sessionId,
      item_id,
      item_name:    item.item_name,
      description:  item.description,
      source_npc:   item.source_npc  ?? null,
      source_scene: item.source_scene ?? null,
      icon:         item.icon         ?? null,
    });
  } catch (e) {
    console.warn("[db] addInventoryItem:", e);
  }
}

// ── 線索欄 ────────────────────────────────────────────────────

export interface PlayerClue {
  id:            string;
  session_id:    string;
  clue_id:       string;
  clue_text:     string;
  clue_type:     "npc" | "scene" | "deduced";
  source_npc?:   string | null;
  source_scene?: string | null;
  category:      "relationship" | "motive" | "method" | "alibi" | "general";
  discovered_at: string;
}

/**
 * 取得玩家已收集的線索。
 */
export async function getPlayerClues(sessionId: string): Promise<PlayerClue[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const db = createServerSupabase();
    const { data, error } = await db
      .from("player_clues")
      .select("*")
      .eq("session_id", sessionId)
      .order("discovered_at", { ascending: true });
    if (error) {
      console.warn("[db] getPlayerClues:", error.message);
      return [];
    }
    return (data ?? []) as PlayerClue[];
  } catch (e) {
    console.warn("[db] getPlayerClues:", e);
    return [];
  }
}

/**
 * 新增一條線索到玩家線索欄。
 */
export async function addPlayerClue(
  sessionId: string,
  clue: {
    clue_text:     string;
    clue_type:     "npc" | "scene" | "deduced";
    source_npc?:   string;
    source_scene?: string;
    category?:     "relationship" | "motive" | "method" | "alibi" | "general";
  },
): Promise<PlayerClue | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const db = createServerSupabase();
    const clue_id = `clue_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const { data, error } = await db
      .from("player_clues")
      .insert({
        session_id:   sessionId,
        clue_id,
        clue_text:    clue.clue_text,
        clue_type:    clue.clue_type,
        source_npc:   clue.source_npc   ?? null,
        source_scene: clue.source_scene ?? null,
        category:     clue.category     ?? "general",
      })
      .select("*")
      .single();
    if (error) {
      console.warn("[db] addPlayerClue:", error.message);
      return null;
    }
    return data as PlayerClue;
  } catch (e) {
    console.warn("[db] addPlayerClue:", e);
    return null;
  }
}

// ── 線索合併 ──────────────────────────────────────────────────

export interface ClueCombination {
  id:              string;
  session_id:      string;
  input_clue_ids:  string[];
  result_clue_id:  string;
  deduced_at:      string;
}

/**
 * 儲存線索合併記錄。
 */
export async function saveClueCombination(
  sessionId:    string,
  inputClueIds: string[],
  resultClueId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const db = createServerSupabase();
    await db.from("clue_combinations").insert({
      session_id:     sessionId,
      input_clue_ids: inputClueIds,
      result_clue_id: resultClueId,
    });
  } catch (e) {
    console.warn("[db] saveClueCombination:", e);
  }
}

/**
 * 取得本局所有線索合併記錄。
 */
export async function getClueCombinations(sessionId: string): Promise<ClueCombination[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const db = createServerSupabase();
    const { data, error } = await db
      .from("clue_combinations")
      .select("*")
      .eq("session_id", sessionId)
      .order("deduced_at", { ascending: true });
    if (error) {
      console.warn("[db] getClueCombinations:", error.message);
      return [];
    }
    return (data ?? []) as ClueCombination[];
  } catch (e) {
    console.warn("[db] getClueCombinations:", e);
    return [];
  }
}

// ── Scene Interactions ─────────────────────────────────────────

export interface SceneInteraction {
  id:                   string;
  session_id:           string;
  scene_id:             string;
  item_id:              string;
  interaction_type:     string;
  first_interacted_at:  string;
}

/**
 * 取得某場景的所有互動記錄。
 */
export async function getSceneInteractions(
  sessionId: string,
  sceneId:   string,
): Promise<SceneInteraction[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const db = createServerSupabase();
    const { data, error } = await db
      .from("scene_interactions")
      .select("*")
      .eq("session_id", sessionId)
      .eq("scene_id", sceneId)
      .order("first_interacted_at", { ascending: true });
    if (error) {
      console.warn("[db] getSceneInteractions:", error.message);
      return [];
    }
    return (data ?? []) as SceneInteraction[];
  } catch (e) {
    console.warn("[db] getSceneInteractions:", e);
    return [];
  }
}

/**
 * 記錄一次場景互動（upsert on session_id+scene_id+item_id）。
 */
export async function recordSceneInteraction(
  sessionId:       string,
  sceneId:         string,
  itemId:          string,
  interactionType: string,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const db = createServerSupabase();
    const { data: existing } = await db
      .from("scene_interactions")
      .select("id")
      .eq("session_id", sessionId)
      .eq("scene_id", sceneId)
      .eq("item_id", itemId)
      .maybeSingle();

    if (!existing) {
      await db.from("scene_interactions").insert({
        session_id:          sessionId,
        scene_id:            sceneId,
        item_id:             itemId,
        interaction_type:    interactionType,
        first_interacted_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.warn("[db] recordSceneInteraction:", e);
  }
}

// ── Scene Visits ───────────────────────────────────────────────

export interface SceneVisit {
  session_id:       string;
  scene_id:         string;
  visit_count:      number;
  first_visited_at: string;
  last_visited_at:  string;
}

/**
 * 取得場景造訪記錄。
 */
export async function getSceneVisit(
  sessionId: string,
  sceneId:   string,
): Promise<SceneVisit | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const db = createServerSupabase();
    const { data, error } = await db
      .from("scene_visits")
      .select("*")
      .eq("session_id", sessionId)
      .eq("scene_id", sceneId)
      .maybeSingle();
    if (error) {
      console.warn("[db] getSceneVisit:", error.message);
      return null;
    }
    return data as SceneVisit | null;
  } catch (e) {
    console.warn("[db] getSceneVisit:", e);
    return null;
  }
}

/**
 * 記錄一次場景造訪（upsert：第一次 insert，之後 increment visit_count）。
 */
export async function recordSceneVisit(
  sessionId: string,
  sceneId:   string,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const db = createServerSupabase();
    const { data: existing } = await db
      .from("scene_visits")
      .select("visit_count")
      .eq("session_id", sessionId)
      .eq("scene_id", sceneId)
      .maybeSingle();

    if (existing) {
      await db
        .from("scene_visits")
        .update({
          visit_count:    (existing.visit_count ?? 0) + 1,
          last_visited_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId)
        .eq("scene_id", sceneId);
    } else {
      const now = new Date().toISOString();
      await db.from("scene_visits").insert({
        session_id:       sessionId,
        scene_id:         sceneId,
        visit_count:      1,
        first_visited_at: now,
        last_visited_at:  now,
      });
    }
  } catch (e) {
    console.warn("[db] recordSceneVisit:", e);
  }
}

// ── 玩家進度聚合查詢 ───────────────────────────────────────────

/**
 * 取得玩家已對話過的所有 NPC ID（conversation_count > 0）。
 */
export async function getTalkedNpcs(sessionId: string): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const db = createServerSupabase();
    const { data } = await db
      .from("npc_states")
      .select("npc_id")
      .eq("session_id", sessionId)
      .gt("conversation_count", 0);
    return (data ?? []).map((r: { npc_id: string }) => r.npc_id);
  } catch (e) {
    console.warn("[db] getTalkedNpcs:", e);
    return [];
  }
}

/**
 * 取得玩家所有已收集的線索 ID。
 */
export async function getCollectedClueIds(sessionId: string): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const db = createServerSupabase();
    const { data } = await db
      .from("player_clues")
      .select("clue_id")
      .eq("session_id", sessionId);
    return (data ?? []).map((r: { clue_id: string }) => r.clue_id);
  } catch (e) {
    console.warn("[db] getCollectedClueIds:", e);
    return [];
  }
}

/**
 * 取得玩家所有已持有的道具 ID。
 */
export async function getInventoryItemIds(sessionId: string): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const db = createServerSupabase();
    const { data } = await db
      .from("player_inventory")
      .select("item_id")
      .eq("session_id", sessionId);
    return (data ?? []).map((r: { item_id: string }) => r.item_id);
  } catch (e) {
    console.warn("[db] getInventoryItemIds:", e);
    return [];
  }
}
