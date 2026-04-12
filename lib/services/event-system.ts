/**
 * 隨機事件系統
 * 觸發時機：AP 里程碑、進入場景時的隨機機率
 * 儲存：localStorage pez_events_{sessionId}
 */

import { GAME_EVENTS, type GameEvent } from "@/lib/content/game-events";

export type EventTrigger = "scene_entry" | "ap_milestone" | "manual";

const KEY = (sessionId: string) => `pez_events_${sessionId}`;

interface StoredEventState {
  triggered:   string[];   // 已觸發的 event ids
  active:      string[];   // 目前「待處理」的 event ids（尚未 dismiss）
}

function load(sessionId: string): StoredEventState {
  try {
    const raw = localStorage.getItem(KEY(sessionId));
    if (!raw) return { triggered: [], active: [] };
    return JSON.parse(raw) as StoredEventState;
  } catch { return { triggered: [], active: [] }; }
}

function save(sessionId: string, state: StoredEventState): void {
  try {
    localStorage.setItem(KEY(sessionId), JSON.stringify(state));
  } catch { /* ignore */ }
}

/** 根據觸發情境決定是否觸發事件，並回傳觸發的事件（或 null）*/
export function checkForEvent(
  sessionId: string,
  trigger: EventTrigger,
): GameEvent | null {
  const state = load(sessionId);

  // 場景進入：10% 機率
  const roll = Math.random();
  const shouldTrigger =
    trigger === "scene_entry"   ? roll < 0.10 :
    trigger === "ap_milestone"  ? roll < 0.40 :
    trigger === "manual"        ? true :
    false;

  if (!shouldTrigger) return null;

  // 選一個尚未觸發過的事件
  const untriggered = GAME_EVENTS.filter(
    (e) => !state.triggered.includes(e.id),
  );
  if (untriggered.length === 0) return null;

  const event = untriggered[Math.floor(Math.random() * untriggered.length)];

  state.triggered.push(event.id);
  if (!state.active.includes(event.id)) {
    state.active.push(event.id);
  }
  save(sessionId, state);
  return event;
}

/** 取得所有「進行中」（尚未 dismiss）的事件 */
export function getActiveEvents(sessionId: string): GameEvent[] {
  const { active } = load(sessionId);
  return active
    .map((id) => GAME_EVENTS.find((e) => e.id === id))
    .filter((e): e is GameEvent => e !== undefined);
}

/** 關閉（dismiss）一個事件 */
export function dismissEvent(sessionId: string, eventId: string): void {
  const state = load(sessionId);
  state.active = state.active.filter((id) => id !== eventId);
  save(sessionId, state);
}

/** 取得所有已觸發事件（用於統計頁面）*/
export function getTriggeredCount(sessionId: string): number {
  return load(sessionId).triggered.length;
}
