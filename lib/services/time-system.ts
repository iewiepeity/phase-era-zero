/**
 * 時段系統 — 將遊戲時間分為四個時段
 *
 * 時段影響：NPC 可出現的場景、對話語氣、特定事件觸發條件。
 * 每 N 次行動後自動推進，或由玩家在特定場景手動休息來推進。
 */

export type TimePeriod = "dawn" | "afternoon" | "dusk" | "midnight";

export interface TimePeriodDef {
  id:             TimePeriod;
  label:          string;      // 中文名稱
  subtitle:       string;      // 英文/時間範圍副標題
  description:    string;      // 氛圍描述
  icon:           string;      // Emoji 圖示
  accentColor:    string;
  /** NPC 可用性調整（0 = 不在，1 = 正常）*/
  npcAvailability: Record<string, number>;
  /** 該時段出現的特殊機率修正 */
  eventMultiplier: number;
}

export const TIME_PERIODS: TimePeriodDef[] = [
  {
    id:          "dawn",
    label:       "清晨",
    subtitle:    "05:00–09:00",
    description: "霧還沒散，城市剛開始有動靜。說話的人比平時少，但留下的線索通常更誠實。",
    icon:        "🌅",
    accentColor: "#fbbf24",
    npcAvailability: {
      chen_jie:        1.0,
      vendor:          1.0,
      homeless:        0.8,
      taosheng:        1.0, // 工地工人早班
      bartender:       0.0, // 酒館未開
      hanzhuo:         0.7,
      zhuanghe:        0.9,
      baiqiu:          0.6, // 藥局未開
      yushuang:        0.5, // 夜班結束
      zhengbo:         0.8,
      linzhixia:       0.5,
      it:              0.4,
      guard:           1.0,
      reporter:        0.6,
      neighbor:        0.8,
      clerk:           0.5,
      taxi_driver:     0.9,
      professor:       0.4,
      player_neighbor: 1.0,
      roommate:        0.7,
      lawyer:          0.3,
      old_friend:      0.6,
      mortician:       0.6,
    },
    eventMultiplier: 0.8,
  },
  {
    id:          "afternoon",
    label:       "午後",
    subtitle:    "12:00–17:00",
    description: "人最多，噪音最大，反而容易藏在人群裡。但 NPC 在忙，說的話不見得比早上多。",
    icon:        "☀️",
    accentColor: "#f59e0b",
    npcAvailability: {
      chen_jie:        0.6, // 午休
      vendor:          0.4, // 備料
      homeless:        0.5,
      taosheng:        0.9,
      bartender:       0.5,
      hanzhuo:         1.0,
      zhuanghe:        1.0,
      baiqiu:          1.0,
      yushuang:        1.0,
      zhengbo:         1.0,
      linzhixia:       1.0,
      it:              0.8,
      guard:           1.0,
      reporter:        1.0,
      neighbor:        0.7,
      clerk:           1.0,
      taxi_driver:     0.8,
      professor:       1.0,
      player_neighbor: 0.7,
      roommate:        0.6,
      lawyer:          1.0,
      old_friend:      0.9,
      mortician:       1.0,
    },
    eventMultiplier: 1.0,
  },
  {
    id:          "dusk",
    label:       "傍晚",
    subtitle:    "17:00–21:00",
    description: "燈還沒全亮，影子拉得很長。這個時段的人比較容易說實話——也比較容易隱瞞。",
    icon:        "🌆",
    accentColor: "#f97316",
    npcAvailability: {
      chen_jie:        1.0, // 晚餐高峰
      vendor:          1.0, // 夜市開始
      homeless:        1.0,
      taosheng:        0.5, // 下班後
      bartender:       1.0,
      hanzhuo:         0.7,
      zhuanghe:        1.0,
      baiqiu:          0.8,
      yushuang:        0.7,
      zhengbo:         0.9,
      linzhixia:       0.9,
      it:              0.9,
      guard:           1.0,
      reporter:        0.8,
      neighbor:        1.0,
      clerk:           0.8,
      taxi_driver:     1.0,
      professor:       0.7,
      player_neighbor: 1.0,
      roommate:        1.0,
      lawyer:          0.8,
      old_friend:      1.0,
      mortician:       0.9,
    },
    eventMultiplier: 1.2,
  },
  {
    id:          "midnight",
    label:       "深夜",
    subtitle:    "21:00–05:00",
    description: "只有該在的人還在這裡。每個出現在深夜的人，都有他不能在白天說的理由。",
    icon:        "🌙",
    accentColor: "#818cf8",
    npcAvailability: {
      chen_jie:        0.3, // 打烊
      vendor:          0.8, // 夜市收尾
      homeless:        1.0,
      taosheng:        0.2,
      bartender:       1.0, // 深夜時段
      hanzhuo:         0.3,
      zhuanghe:        0.7, // 深夜巡邏習慣
      baiqiu:          0.0, // 藥局關門
      yushuang:        0.9, // 夜班
      zhengbo:         0.6,
      linzhixia:       0.5,
      it:              1.0, // 深夜活動者
      guard:           0.9,
      reporter:        0.4,
      neighbor:        0.2,
      clerk:           0.0,
      taxi_driver:     1.0,
      professor:       0.2,
      player_neighbor: 0.3,
      roommate:        0.7,
      lawyer:          0.1,
      old_friend:      0.4,
      mortician:       0.8,
    },
    eventMultiplier: 1.5,
  },
];

export const TIME_PERIOD_ORDER: TimePeriod[] = ["dawn", "afternoon", "dusk", "midnight"];

/** 取得時段定義 */
export function getTimePeriod(id: TimePeriod): TimePeriodDef {
  return TIME_PERIODS.find((t) => t.id === id) ?? TIME_PERIODS[1];
}

// ── localStorage 管理 ─────────────────────────────────────────

function storageKey(sessionId: string): string {
  return `pez_time_${sessionId}`;
}

/** 取得目前時段（預設午後）*/
export function getCurrentTimePeriod(sessionId: string): TimePeriod {
  try {
    const raw = localStorage.getItem(storageKey(sessionId));
    if (!raw) return "afternoon";
    return (TIME_PERIOD_ORDER as string[]).includes(raw)
      ? (raw as TimePeriod)
      : "afternoon";
  } catch { return "afternoon"; }
}

/** 設定時段 */
export function setTimePeriod(sessionId: string, period: TimePeriod): void {
  try {
    localStorage.setItem(storageKey(sessionId), period);
  } catch { /* ignore */ }
}

/** 推進到下一個時段，回傳新的時段 */
export function advanceTimePeriod(sessionId: string): TimePeriod {
  const current = getCurrentTimePeriod(sessionId);
  const idx     = TIME_PERIOD_ORDER.indexOf(current);
  const next    = TIME_PERIOD_ORDER[(idx + 1) % TIME_PERIOD_ORDER.length];
  setTimePeriod(sessionId, next);
  return next;
}

/**
 * 取得某個 NPC 在目前時段的可用性（0–1）
 * 0 = 無法找到，1 = 正常可用
 */
export function getNpcAvailability(sessionId: string, npcId: string): number {
  const period = getTimePeriod(getCurrentTimePeriod(sessionId));
  return period.npcAvailability[npcId] ?? 0.5;
}
