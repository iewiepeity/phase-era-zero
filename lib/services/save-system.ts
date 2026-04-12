/**
 * 存檔系統 — 手動快照所有 localStorage 遊戲狀態
 * 儲存：localStorage pez_saves = JSON 陣列（最多 5 個存檔槽）
 */

const SAVES_KEY = "pez_saves";
const MAX_SLOTS = 5;

// 一局遊戲用到的所有 localStorage 前綴
const GAME_KEY_PREFIXES = [
  "pez_seen_intro_",
  "pez_result_",
  "pez_identity_",
  "pez_difficulty_",
  "pez_visited_",
  "pez_achievements_",
  "pez_interacted_",
  "pez_ap_",
  "pez_max_ap_",
  "pez_silent_",
  "pez_notebook_",
  "pez_act_",
  "pez_ev_",
  "pez_npc_events_",
  "pez_time_",
  "pez_events_",
  "pez_audio_volume",
  "pez_audio_enabled",
];

export interface SaveSlot {
  id:        string;
  sessionId: string;
  label:     string;
  savedAt:   number;
  snapshot:  Record<string, string>;
}

export interface SaveSnapshot {
  sessionId: string;
  savedAt:   number;
  snapshot:  Record<string, string>;
}

function loadSlots(): SaveSlot[] {
  try {
    const raw = localStorage.getItem(SAVES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SaveSlot[];
  } catch { return []; }
}

function persistSlots(slots: SaveSlot[]): void {
  try {
    localStorage.setItem(SAVES_KEY, JSON.stringify(slots));
  } catch { /* ignore */ }
}

/** 快照當前遊戲的所有 localStorage 鍵值 */
export function saveGame(sessionId: string): SaveSnapshot {
  const snapshot: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    const isGameKey = GAME_KEY_PREFIXES.some((prefix) => k.startsWith(prefix));
    const isSessionKey = k.includes(sessionId);
    if (isGameKey || isSessionKey) {
      const val = localStorage.getItem(k);
      if (val !== null) snapshot[k] = val;
    }
  }

  const slots  = loadSlots();
  const slotId = `save_${Date.now()}`;
  const slot: SaveSlot = {
    id:        slotId,
    sessionId,
    label:     `存檔 ${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`,
    savedAt:   Date.now(),
    snapshot,
  };

  // 超過上限時移除最舊的
  const updated = [...slots, slot];
  if (updated.length > MAX_SLOTS) updated.splice(0, updated.length - MAX_SLOTS);
  persistSlots(updated);

  return { sessionId, savedAt: slot.savedAt, snapshot };
}

/** 從快照還原所有 localStorage 鍵值 */
export function loadGame(snapshot: SaveSnapshot): void {
  for (const [k, v] of Object.entries(snapshot.snapshot)) {
    try {
      localStorage.setItem(k, v);
    } catch { /* ignore */ }
  }
}

/** 匯出存檔為 base64 字串 */
export function exportSave(sessionId: string): string {
  const snap = saveGame(sessionId);
  return btoa(encodeURIComponent(JSON.stringify(snap)));
}

/** 從 base64 字串匯入存檔 */
export function importSave(data: string): void {
  try {
    const snap = JSON.parse(decodeURIComponent(atob(data))) as SaveSnapshot;
    loadGame(snap);
  } catch {
    throw new Error("無效的存檔資料");
  }
}

export function listSaves(): SaveSlot[] {
  return loadSlots().sort((a, b) => b.savedAt - a.savedAt);
}

export function deleteSave(slotId: string): void {
  const slots   = loadSlots();
  const updated = slots.filter((s) => s.id !== slotId);
  persistSlots(updated);
}
