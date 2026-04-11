/**
 * 行動點服務 — 管理玩家每局的行動點數
 *
 * 儲存：localStorage（前端即時讀寫）+ Supabase（持久化）
 * 消耗：對話 1 點、進入場景 1 點、梳理線索 2 點
 * 初始化：難度頁確認時設定
 */

import { STORAGE_KEYS } from "@/lib/constants";
import type { DifficultyId } from "@/lib/content/difficulty";

/** 難度對應初始行動點 */
export const DIFFICULTY_ACTION_POINTS: Record<DifficultyId, number> = {
  easy:      40,
  normal:    30,
  hard:      20,
  nightmare: 20,
};

// ── 讀取 ───────────────────────────────────────────────────────

export function getActionPoints(sessionId: string): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTION_POINTS(sessionId));
    if (raw === null) return -1; // 尚未初始化
    return parseInt(raw, 10) || 0;
  } catch { return -1; }
}

export function getMaxActionPoints(sessionId: string): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MAX_ACTION_POINTS(sessionId));
    if (raw === null) return 30;
    return parseInt(raw, 10) || 30;
  } catch { return 30; }
}

// ── 初始化（難度選完後呼叫）────────────────────────────────────

export function initActionPoints(sessionId: string, difficulty: DifficultyId): void {
  const max = DIFFICULTY_ACTION_POINTS[difficulty];
  try {
    localStorage.setItem(STORAGE_KEYS.ACTION_POINTS(sessionId), String(max));
    localStorage.setItem(STORAGE_KEYS.MAX_ACTION_POINTS(sessionId), String(max));
  } catch { /* ignore */ }
}

// ── 消耗 ───────────────────────────────────────────────────────

/**
 * 消耗行動點，回傳消耗後的剩餘點數。
 * 不足時不扣為負數，回傳 0。
 */
export function consumeActionPoints(sessionId: string, amount: number): number {
  try {
    const current = getActionPoints(sessionId);
    if (current < 0) return -1; // 尚未初始化，不扣
    const next = Math.max(0, current - amount);
    localStorage.setItem(STORAGE_KEYS.ACTION_POINTS(sessionId), String(next));
    return next;
  } catch { return 0; }
}

// ── 同步 DB ────────────────────────────────────────────────────

/**
 * 將本地行動點同步到 Supabase（非阻塞）。
 * 在關鍵消耗點呼叫，允許失敗。
 */
export async function syncActionPointsToDB(sessionId: string): Promise<void> {
  try {
    const current = getActionPoints(sessionId);
    if (current < 0) return;
    await fetch("/api/game/action-points", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ sessionId, actionPoints: current }),
    });
  } catch { /* silently ignore */ }
}
