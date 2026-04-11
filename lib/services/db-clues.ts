/**
 * DB — 線索、道具欄、線索合併
 * 包含：player_clues、player_inventory、clue_combinations
 */

import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase";

// ── 道具欄 ─────────────────────────────────────────────────────

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
      console.warn("[db-clues] getPlayerInventory:", error.message);
      return [];
    }
    return (data ?? []) as InventoryItem[];
  } catch (e) {
    console.warn("[db-clues] getPlayerInventory:", e);
    return [];
  }
}

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
    console.warn("[db-clues] addInventoryItem:", e);
  }
}

// ── 線索欄 ─────────────────────────────────────────────────────

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
      console.warn("[db-clues] getPlayerClues:", error.message);
      return [];
    }
    return (data ?? []) as PlayerClue[];
  } catch (e) {
    console.warn("[db-clues] getPlayerClues:", e);
    return [];
  }
}

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
      console.warn("[db-clues] addPlayerClue:", error.message);
      return null;
    }
    return data as PlayerClue;
  } catch (e) {
    console.warn("[db-clues] addPlayerClue:", e);
    return null;
  }
}

export async function getCriticalClueCount(sessionId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  try {
    const db = createServerSupabase();
    const { data } = await db
      .from("player_clues")
      .select("clue_id", { count: "exact" })
      .eq("session_id", sessionId);
    return data?.length ?? 0;
  } catch {
    return 0;
  }
}

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
    console.warn("[db-clues] getCollectedClueIds:", e);
    return [];
  }
}

// ── 線索合併 ───────────────────────────────────────────────────

export interface ClueCombination {
  id:              string;
  session_id:      string;
  input_clue_ids:  string[];
  result_clue_id:  string;
  deduced_at:      string;
}

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
    console.warn("[db-clues] saveClueCombination:", e);
  }
}

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
      console.warn("[db-clues] getClueCombinations:", error.message);
      return [];
    }
    return (data ?? []) as ClueCombination[];
  } catch (e) {
    console.warn("[db-clues] getClueCombinations:", e);
    return [];
  }
}

// ── 道具 ID 聚合 ───────────────────────────────────────────────

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
    console.warn("[db-clues] getInventoryItemIds:", e);
    return [];
  }
}
