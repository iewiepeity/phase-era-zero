/**
 * 存檔系統 — 完整遊戲狀態的序列化與恢復
 *
 * 存檔策略：
 *   1. localStorage — 本地快照，立即可用
 *   2. Supabase — 遠端備份，需要網路
 *
 * 觸發點：進入場景後、對話結束後、手動存檔（設定頁面）
 */

import { STORAGE_KEYS } from "@/lib/constants";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase";

// ── 存檔資料結構 ──────────────────────────────────────────────

export interface GameSaveData {
  version:   number;   // 向前相容版本號
  sessionId: string;
  savedAt:   number;   // timestamp
  state: {
    identity:        string;
    difficulty:      string;
    currentAct:      number;
    evValue:         number;
    actionPoints:    number;
    maxActionPoints: number;
    visitedScenes:   string[];
    achievements:    string[];
    seenIntro:       boolean;
    silentEnding:    boolean;
  };
  notebook:      string;
  npcEvents:     string;
  notifications: string;
  eavesdropped:  string;
  timePeriod:    string;
}

export const SAVE_VERSION = 1;

// ── localStorage 存取 ─────────────────────────────────────────

function localSaveKey(sessionId: string): string {
  return `pez_save_${sessionId}`;
}

/**
 * 從 localStorage 讀取目前遊戲狀態並序列化。
 * 純讀取，不寫入任何資料。
 */
export function captureLocalSave(sessionId: string): GameSaveData {
  const get    = (key: string)               => localStorage.getItem(key) ?? "";
  const getInt = (key: string, def: number)  =>
    parseInt(localStorage.getItem(key) ?? String(def), 10) || def;

  return {
    version:   SAVE_VERSION,
    sessionId,
    savedAt:   Date.now(),
    state: {
      identity:        get(STORAGE_KEYS.IDENTITY(sessionId)) || "normal",
      difficulty:      get(STORAGE_KEYS.DIFFICULTY(sessionId)) || "normal",
      currentAct:      getInt(`pez_act_${sessionId}`, 1),
      evValue:         getInt(`pez_ev_${sessionId}`, 0),
      actionPoints:    getInt(STORAGE_KEYS.ACTION_POINTS(sessionId), -1),
      maxActionPoints: getInt(STORAGE_KEYS.MAX_ACTION_POINTS(sessionId), 30),
      visitedScenes:   (get(STORAGE_KEYS.VISITED_SCENES(sessionId)) || "").split(",").filter(Boolean),
      achievements:    (get(STORAGE_KEYS.ACHIEVEMENTS(sessionId)) || "").split(",").filter(Boolean),
      seenIntro:       get(STORAGE_KEYS.SEEN_INTRO(sessionId)) === "true",
      silentEnding:    get(STORAGE_KEYS.SILENT_ENDING(sessionId)) === "true",
    },
    notebook:      get(STORAGE_KEYS.NOTEBOOK(sessionId)),
    npcEvents:     get(`pez_npc_events_${sessionId}`),
    notifications: get(`pez_game_notifications_${sessionId}`),
    eavesdropped:  get(`pez_eavesdrop_${sessionId}`),
    timePeriod:    get(`pez_time_${sessionId}`) || "afternoon",
  };
}

/** 將存檔資料寫回 localStorage（從遠端或備份恢復時使用）*/
export function restoreLocalSave(save: GameSaveData): void {
  const { sessionId, state } = save;
  const set = (key: string, val: string) => { if (val) localStorage.setItem(key, val); };

  set(STORAGE_KEYS.IDENTITY(sessionId),   state.identity);
  set(STORAGE_KEYS.DIFFICULTY(sessionId), state.difficulty);
  localStorage.setItem(`pez_act_${sessionId}`, String(state.currentAct));
  localStorage.setItem(`pez_ev_${sessionId}`,  String(state.evValue));
  localStorage.setItem(STORAGE_KEYS.ACTION_POINTS(sessionId),     String(state.actionPoints));
  localStorage.setItem(STORAGE_KEYS.MAX_ACTION_POINTS(sessionId), String(state.maxActionPoints));

  if (state.visitedScenes.length > 0)
    localStorage.setItem(STORAGE_KEYS.VISITED_SCENES(sessionId), state.visitedScenes.join(","));
  if (state.achievements.length > 0)
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS(sessionId), state.achievements.join(","));
  if (state.seenIntro)
    localStorage.setItem(STORAGE_KEYS.SEEN_INTRO(sessionId), "true");
  if (state.silentEnding)
    localStorage.setItem(STORAGE_KEYS.SILENT_ENDING(sessionId), "true");

  if (save.notebook)      localStorage.setItem(STORAGE_KEYS.NOTEBOOK(sessionId),        save.notebook);
  if (save.npcEvents)     localStorage.setItem(`pez_npc_events_${sessionId}`,           save.npcEvents);
  if (save.notifications) localStorage.setItem(`pez_game_notifications_${sessionId}`,   save.notifications);
  if (save.eavesdropped)  localStorage.setItem(`pez_eavesdrop_${sessionId}`,            save.eavesdropped);
  if (save.timePeriod)    localStorage.setItem(`pez_time_${sessionId}`,                 save.timePeriod);
}

/** 將快照寫入 localStorage */
export function writeLocalSave(sessionId: string): GameSaveData {
  const save = captureLocalSave(sessionId);
  try {
    localStorage.setItem(localSaveKey(sessionId), JSON.stringify(save));
  } catch { /* ignore */ }
  return save;
}

/** 從 localStorage 讀取存檔 */
export function readLocalSave(sessionId: string): GameSaveData | null {
  try {
    const raw = localStorage.getItem(localSaveKey(sessionId));
    if (!raw) return null;
    return JSON.parse(raw) as GameSaveData;
  } catch { return null; }
}

/** 刪除 localStorage 存檔 */
export function deleteLocalSave(sessionId: string): void {
  try {
    localStorage.removeItem(localSaveKey(sessionId));
  } catch { /* ignore */ }
}

// ── Supabase 遠端存取 ─────────────────────────────────────────

/** 將存檔上傳到 Supabase（upsert，同一 session 只保留最新一份）*/
export async function uploadSaveToSupabase(save: GameSaveData): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const db = createServerSupabase();
    const { error } = await db
      .from("game_saves")
      .upsert(
        {
          session_id: save.sessionId,
          version:    save.version,
          saved_at:   new Date(save.savedAt).toISOString(),
          save_data:  save,
        },
        { onConflict: "session_id" },
      );
    if (error) {
      console.warn("[save-system] uploadSaveToSupabase:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[save-system] uploadSaveToSupabase:", e);
    return false;
  }
}

/** 從 Supabase 下載存檔 */
export async function downloadSaveFromSupabase(sessionId: string): Promise<GameSaveData | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const db = createServerSupabase();
    const { data, error } = await db
      .from("game_saves")
      .select("save_data")
      .eq("session_id", sessionId)
      .single();
    if (error || !data) return null;
    return data.save_data as GameSaveData;
  } catch { return null; }
}

// ── API 路由封裝（client component 用）───────────────────────

/** 透過 API 路由觸發存檔（前端 client component 用）*/
export async function saveThroughApi(sessionId: string): Promise<boolean> {
  try {
    const save = captureLocalSave(sessionId);
    const res  = await fetch("/api/game/save", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ sessionId, save }),
    });
    return res.ok;
  } catch { return false; }
}

/** 透過 API 路由載入存檔，並恢復到 localStorage */
export async function loadThroughApi(sessionId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/game/save?sessionId=${encodeURIComponent(sessionId)}`);
    if (!res.ok) return false;
    const { save } = (await res.json()) as { save: GameSaveData };
    restoreLocalSave(save);
    return true;
  } catch { return false; }
}

// ── 自動存檔 ──────────────────────────────────────────────────

/** 自動存檔（非阻塞）。在關鍵節點呼叫，不等待完成。*/
export function autoSave(sessionId: string): void {
  try {
    writeLocalSave(sessionId);
    saveThroughApi(sessionId).catch(() => { /* ignore */ });
  } catch { /* ignore */ }
}
