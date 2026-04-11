/**
 * DB — 對話與 NPC 狀態
 * 包含：chat_messages CRUD、npc_states CRUD
 */

import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { NpcState } from "@/lib/npc-engine";
import type { DbChatMessage, DbNpcState } from "@/lib/types";

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

    const newTrust = Math.min(100, Math.max(-100, (existing?.trust_level ?? 0) + trustDelta));
    const revealed = [...(existing?.clues_revealed ?? [])];
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
    console.warn("[db-chat] updateNpcState:", e);
  }
}

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
    console.warn("[db-chat] saveChatMessages:", e);
  }
}

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
    console.error("[db-chat] getChatHistory:", e);
    return { messages: [], npcState: null };
  }
}

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
    console.warn("[db-chat] getTalkedNpcs:", e);
    return [];
  }
}
