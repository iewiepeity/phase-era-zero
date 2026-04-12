/**
 * 事件引擎 — 負責檢查並觸發壓力/隨機事件
 *
 * 呼叫 checkAndTriggerEvents() 的時機：
 *   - 每次場景切換
 *   - 每次對話結束
 *   - Hub 頁面重新載入時
 */

import { GAME_EVENTS, type GameEventDef, type GameEventEffect } from "@/lib/content/game-events";
import { getActionPoints } from "@/lib/services/action-points";

// ── 觸發歷史（localStorage）──────────────────────────────────

interface TriggerRecord {
  lastTriggeredAt: number;
  count:           number;
}

function getTriggerKey(sessionId: string): string {
  return `pez_event_triggers_${sessionId}`;
}

function getTriggerHistory(sessionId: string): Record<string, TriggerRecord> {
  try {
    const raw = localStorage.getItem(getTriggerKey(sessionId));
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, TriggerRecord>;
  } catch { return {}; }
}

function saveTriggerHistory(sessionId: string, history: Record<string, TriggerRecord>): void {
  try {
    localStorage.setItem(getTriggerKey(sessionId), JSON.stringify(history));
  } catch { /* ignore */ }
}

// ── 通知佇列（localStorage）──────────────────────────────────

export interface GameNotification {
  id:        string;
  title:     string;
  message:   string;
  type:      "pressure" | "random";
  createdAt: number;
  read:      boolean;
}

function getNotifKey(sessionId: string): string {
  return `pez_game_notifications_${sessionId}`;
}

export function getGameNotifications(sessionId: string): GameNotification[] {
  try {
    const raw = localStorage.getItem(getNotifKey(sessionId));
    if (!raw) return [];
    return JSON.parse(raw) as GameNotification[];
  } catch { return []; }
}

export function markNotificationRead(sessionId: string, notifId: string): void {
  try {
    const notifs = getGameNotifications(sessionId).map((n) =>
      n.id === notifId ? { ...n, read: true } : n,
    );
    localStorage.setItem(getNotifKey(sessionId), JSON.stringify(notifs));
  } catch { /* ignore */ }
}

export function markAllNotificationsRead(sessionId: string): void {
  try {
    const notifs = getGameNotifications(sessionId).map((n) => ({ ...n, read: true }));
    localStorage.setItem(getNotifKey(sessionId), JSON.stringify(notifs));
  } catch { /* ignore */ }
}

export function getUnreadNotificationCount(sessionId: string): number {
  return getGameNotifications(sessionId).filter((n) => !n.read).length;
}

function pushNotification(
  sessionId: string,
  event:     GameEventDef,
  message:   string,
): void {
  try {
    const notifs = getGameNotifications(sessionId);
    notifs.push({
      id:        `notif_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
      title:     event.title,
      message,
      type:      event.type,
      createdAt: Date.now(),
      read:      false,
    });
    localStorage.setItem(getNotifKey(sessionId), JSON.stringify(notifs));
  } catch { /* ignore */ }
}

// ── 效果執行 ─────────────────────────────────────────────────

function applyEffect(
  sessionId: string,
  effect:    GameEventEffect,
  event:     GameEventDef,
): void {
  switch (effect.type) {
    case "notification":
      pushNotification(sessionId, event, effect.message);
      break;
    case "clue_hint":
      pushNotification(sessionId, event, effect.hint);
      break;
    case "ap_drain": {
      try {
        const key  = `pez_ap_${sessionId}`;
        const cur  = parseInt(localStorage.getItem(key) ?? "0", 10);
        const next = Math.max(0, cur - effect.amount);
        localStorage.setItem(key, String(next));
      } catch { /* ignore */ }
      pushNotification(sessionId, event, event.description);
      break;
    }
    case "ev_increase": {
      try {
        const key  = `pez_ev_${sessionId}`;
        const cur  = parseInt(localStorage.getItem(key) ?? "0", 10);
        const next = Math.min(100, cur + effect.amount);
        localStorage.setItem(key, String(next));
      } catch { /* ignore */ }
      break;
    }
    case "npc_lock": {
      try {
        const currentAct = parseInt(localStorage.getItem(`pez_act_${sessionId}`) ?? "1", 10);
        localStorage.setItem(
          `pez_npc_lock_${sessionId}_${effect.npcId}`,
          String(currentAct + effect.duration),
        );
      } catch { /* ignore */ }
      break;
    }
    case "scene_lock": {
      try {
        const currentAct = parseInt(localStorage.getItem(`pez_act_${sessionId}`) ?? "1", 10);
        localStorage.setItem(
          `pez_scene_lock_${sessionId}_${effect.sceneId}`,
          String(currentAct + effect.duration),
        );
      } catch { /* ignore */ }
      break;
    }
  }
}

// ── 主要觸發器 ────────────────────────────────────────────────

export interface EventCheckContext {
  sessionId:     string;
  currentAct:    number;
  identity:      "normal" | "phase2";
  visitedScenes: string[];
}

/**
 * 檢查並觸發符合條件的遊戲事件。
 * 回傳本次觸發的事件 ID 列表。
 */
export function checkAndTriggerEvents(ctx: EventCheckContext): string[] {
  const { sessionId, currentAct, identity, visitedScenes } = ctx;
  const triggered: string[] = [];

  const ap    = getActionPoints(sessionId);
  const evRaw = typeof window !== "undefined"
    ? parseInt(localStorage.getItem(`pez_ev_${sessionId}`) ?? "0", 10)
    : 0;

  const history = getTriggerHistory(sessionId);
  const now     = Date.now();

  for (const event of GAME_EVENTS) {
    const t = event.trigger;

    if (t.actMin     !== undefined && currentAct < t.actMin)           continue;
    if (t.actMax     !== undefined && currentAct > t.actMax)           continue;
    if (t.apMax      !== undefined && ap > t.apMax)                    continue;
    if (t.evMin      !== undefined && evRaw < t.evMin)                 continue;
    if (t.identityOnly !== undefined && identity !== t.identityOnly)   continue;
    if (t.visitedScene !== undefined && !visitedScenes.includes(t.visitedScene)) continue;

    const rec = history[event.id];
    if (event.once && rec && rec.count > 0) continue;
    if (rec && now - rec.lastTriggeredAt < event.cooldownMs) continue;
    if (Math.random() > event.probability) continue;

    for (const effect of event.effects) {
      applyEffect(sessionId, effect, event);
    }

    history[event.id] = {
      lastTriggeredAt: now,
      count:           (rec?.count ?? 0) + 1,
    };

    triggered.push(event.id);
  }

  saveTriggerHistory(sessionId, history);
  return triggered;
}

/** 清除所有事件歷史（新局開始時呼叫）*/
export function clearEventHistory(sessionId: string): void {
  try {
    localStorage.removeItem(getTriggerKey(sessionId));
    localStorage.removeItem(getNotifKey(sessionId));
  } catch { /* ignore */ }
}
