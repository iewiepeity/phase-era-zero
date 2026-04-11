/**
 * DB — 遊戲 Session 管理
 * 包含：Session CRUD、難度、身份、幕次、分數
 */

import { createServerSupabase, isSupabaseConfigured, requireSupabase } from "@/lib/supabase";
import type { KillerId, MotiveDirection, CaseConfig } from "@/lib/case-config";

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
      console.warn("[db-game] ensureSession:", error.message);
      return null;
    }
    return created.id;
  } catch (e) {
    console.warn("[db-game] ensureSession:", e);
    return null;
  }
}

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
    console.warn("[db-game] abandonActiveSessions:", e);
  }
}

export async function createGameSession(params: {
  guestId:          string;
  killerId:         KillerId;
  motiveDirection:  MotiveDirection;
  truthString?:     string;
  subMotiveId?:     string;
}): Promise<string | null> {
  requireSupabase("createGameSession");
  try {
    const db = createServerSupabase();
    const { data, error } = await db
      .from("game_sessions")
      .insert({
        player_name:      params.guestId,
        killer_id:        params.killerId,
        motive_direction: params.motiveDirection,
        truth_string:     params.truthString ?? null,
        sub_motive_id:    params.subMotiveId  ?? null,
        status:           "active",
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`[db-game] createGameSession DB error: ${error.message} (code=${error.code})`);
    }
    return data.id;
  } catch (e) {
    // re-throw so new/route.ts catch block surfaces the real error
    throw e;
  }
}

export async function getGameSession(sessionId: string): Promise<{
  id:               string;
  killer_id:        string;
  motive_direction: string;
  player_name:      string;
  status:           string;
  truth_string?:    string;
  sub_motive_id?:   string;
  difficulty?:      string;
  player_identity?: string;
  current_act?:     number;
} | null> {
  if (!isSupabaseConfigured()) return null;   // accuse route handles local_ fallback
  try {
    const db = createServerSupabase();
    const { data, error } = await db
      .from("game_sessions")
      .select("id, killer_id, motive_direction, player_name, status, truth_string, sub_motive_id, difficulty, player_identity, current_act")
      .eq("id", sessionId)
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

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
    console.warn("[db-game] updateDifficulty:", e);
  }
}

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
    console.warn("[db-game] updateCurrentAct:", e);
  }
}

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
    console.warn("[db-game] updatePlayerIdentity:", e);
  }
}

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
    console.warn("[db-game] completeGameSession:", e);
  }
}

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

export async function getSessionMeta(sessionId: string): Promise<{
  difficulty:      "easy" | "normal" | "hard";
  playerIdentity:  "normal" | "phase2";
  currentAct:      number;
} | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const db = createServerSupabase();
    const { data } = await db
      .from("game_sessions")
      .select("difficulty, player_identity, current_act")
      .eq("id", sessionId)
      .maybeSingle();
    if (!data) return null;
    return {
      difficulty:     (data.difficulty     ?? "normal") as "easy" | "normal" | "hard",
      playerIdentity: (data.player_identity ?? "normal") as "normal" | "phase2",
      currentAct:     data.current_act ?? 1,
    };
  } catch {
    return null;
  }
}

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
    console.warn("[db-game] upsertPlayerProgress:", e);
  }
}
