/**
 * 資料庫服務層 — 場景互動相關 CRUD
 */

import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase";

// ── Scene Interactions ─────────────────────────────────────────

export interface SceneInteraction {
  id:                   string;
  session_id:           string;
  scene_id:             string;
  item_id:              string;
  interaction_type:     string;
  first_interacted_at:  string;
}

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
