/**
 * 時間流動系統
 * 4 個時段：早晨(0) / 午後(1) / 傍晚(2) / 深夜(3)
 * 每消耗 5 AP 推進一個時段
 * 儲存：localStorage pez_time_{sessionId}
 */

export type TimePeriod = 0 | 1 | 2 | 3;

export const PERIOD_NAMES: Record<TimePeriod, string> = {
  0: "早晨",
  1: "午後",
  2: "傍晚",
  3: "深夜",
};

export const PERIOD_RANGE: Record<TimePeriod, string> = {
  0: "06:00 – 12:00",
  1: "12:00 – 18:00",
  2: "18:00 – 22:00",
  3: "22:00 – 06:00",
};

// NPC 可用時段白名單（不在清單的時段表示「不在場」）
const NPC_AVAILABILITY: Record<string, TimePeriod[]> = {
  chen_jie:      [0, 1, 2],       // 麵館白天開到傍晚
  hanzhuo:       [1, 2, 3],       // 午後才現身
  yushuang:      [0, 1, 2],       // 警局白天
  it:            [0, 1],          // 只在上班時間
  baiqiu:        [0, 1, 2],       // 藥局白天
  zhuanghe:      [0, 1, 2, 3],    // 碼頭全天
  taosheng:      [0, 1],          // 早班工地
  linzhixia:     [1, 2, 3],       // 實驗室下午到深夜
  guard:         [0, 1, 2],       // 白班警衛
  reporter:      [0, 1, 2, 3],    // 記者全天
  neighbor:      [0, 1, 2],
  clerk:         [0, 1, 2],
  taxi_driver:   [2, 3, 0],       // 夜班計程車
  professor:     [0, 1, 2],
  bartender:     [2, 3],          // 夜間開酒吧
  homeless:      [0, 1, 2, 3],
  vendor:        [2, 3],          // 夜市攤販
  mortician:     [0, 1],
  player_neighbor: [0, 1, 2, 3],
  roommate:      [2, 3, 0],
  lawyer:        [0, 1, 2],
  old_friend:    [1, 2, 3],
};

const KEY = (sessionId: string) => `pez_time_${sessionId}`;

export function getCurrentPeriod(sessionId: string): TimePeriod {
  try {
    const raw = localStorage.getItem(KEY(sessionId));
    const n = raw !== null ? parseInt(raw, 10) : 0;
    return (([0, 1, 2, 3].includes(n) ? n : 0) as TimePeriod);
  } catch { return 0; }
}

/**
 * 根據已消耗的累計 AP 推進時段。
 * 每 5 AP 前進一個時段（迴圈）。
 * 回傳當前時段。
 */
export function advanceTime(sessionId: string, apUsed: number): TimePeriod {
  const current = getCurrentPeriod(sessionId);
  const steps   = Math.floor(apUsed / 5) % 4;
  const next    = ((current + steps) % 4) as TimePeriod;
  try {
    localStorage.setItem(KEY(sessionId), String(next));
  } catch { /* ignore */ }
  return next;
}

export function getPeriodName(period: TimePeriod): string {
  return PERIOD_NAMES[period];
}

export function isNpcAvailable(npcId: string, period: TimePeriod): boolean {
  const avail = NPC_AVAILABILITY[npcId];
  if (!avail) return true; // 未定義的 NPC 預設全天可用
  return avail.includes(period);
}
