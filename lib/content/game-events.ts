/**
 * 遊戲事件定義 — 壓力事件與隨機事件
 *
 * 壓力事件（pressure）：在特定條件下必然觸發
 * 隨機事件（random）：在符合條件時以機率觸發
 */

export type GameEventType = "pressure" | "random";

export type GameEventEffect =
  | { type: "ap_drain";     amount: number }
  | { type: "ev_increase";  amount: number }
  | { type: "npc_lock";     npcId: string;   duration: number }
  | { type: "scene_lock";   sceneId: string; duration: number }
  | { type: "clue_hint";    hint: string }
  | { type: "notification"; message: string };

export interface GameEventDef {
  id:          string;
  type:        GameEventType;
  title:       string;
  description: string;
  /** 觸發條件 */
  trigger: {
    actMin?:       number;
    actMax?:       number;
    apMax?:        number;   // 行動點低於此值時才觸發
    evMin?:        number;   // EV 高於此值才觸發（B 路線）
    visitedScene?: string;   // 必須已訪問某場景
    identityOnly?: "normal" | "phase2";
  };
  probability:  number;      // 0–1（pressure 事件設 1）
  cooldownMs:   number;      // 同一事件兩次觸發的最小間隔（ms）
  effects:      GameEventEffect[];
  once?:        boolean;     // 是否只觸發一次
}

export const GAME_EVENTS: GameEventDef[] = [

  // ══ 壓力事件 ══════════════════════════════════════════════

  {
    id:          "pressure_act2_warning",
    type:        "pressure",
    title:       "時間流逝",
    description: "案子發生已過了一些天，警方開始結案壓力出現。你感覺到留給自己的時間不多了。",
    trigger:     { actMin: 2, actMax: 2 },
    probability: 1,
    cooldownMs:  0,
    effects:     [{ type: "notification", message: "案發後第三天——調查時間有限，請加快步調。" }],
    once:        true,
  },
  {
    id:          "pressure_low_ap",
    type:        "pressure",
    title:       "體力透支",
    description: "長時間的調查讓你精疲力竭。每一個選擇都需要更謹慎。",
    trigger:     { apMax: 5 },
    probability: 1,
    cooldownMs:  3_600_000,
    effects:     [{ type: "notification", message: "行動點即將耗盡——再想清楚下一步。" }],
  },
  {
    id:          "pressure_act3_finale",
    type:        "pressure",
    title:       "最後機會",
    description: "這是最後的機會把線索串起來。做出錯誤的指控，一切都結束了。",
    trigger:     { actMin: 3, actMax: 3 },
    probability: 1,
    cooldownMs:  0,
    effects:     [{ type: "notification", message: "第三幕——你只剩最後一輪調查時間。準備好指控了嗎？" }],
    once:        true,
  },

  // ── B 路線壓力事件 ────────────────────────────────────────

  {
    id:          "pressure_ev_high",
    type:        "pressure",
    title:       "侵蝕警告",
    description: "你感覺到自己的判斷開始受到干擾。那些聲音越來越清晰，越來越難分辨哪個是你自己的想法。",
    trigger:     { evMin: 60, identityOnly: "phase2" },
    probability: 1,
    cooldownMs:  1_800_000,
    effects:     [
      { type: "notification", message: "侵蝕值過高——你的判斷可能已受影響，請謹慎評估每一個線索。" },
      { type: "ev_increase",  amount: 5 },
    ],
  },

  // ══ 隨機事件 ══════════════════════════════════════════════

  {
    id:          "random_surveillance",
    type:        "random",
    title:       "有人在盯著你",
    description: "你在換場景的時候，感覺到有人的目光一直跟著你。轉頭，沒有人。",
    trigger:     { actMin: 2 },
    probability: 0.15,
    cooldownMs:  7_200_000,
    effects:     [{ type: "notification", message: "你感覺被跟蹤——留意周圍，也留意你問過的人。" }],
  },
  {
    id:          "random_tip_from_unknown",
    type:        "random",
    title:       "匿名提示",
    description: "你的口袋裡多了一張紙條，你不知道是誰塞的。上面寫著一個場景名稱。",
    trigger:     { actMin: 1 },
    probability: 0.12,
    cooldownMs:  14_400_000,
    once:        true,
    effects:     [{ type: "clue_hint", hint: "有人希望你去碼頭那邊再看一次。" }],
  },
  {
    id:          "random_npc_nervous",
    type:        "random",
    title:       "NPC 情緒波動",
    description: "你和某人說話的時候，他的手微微在抖。他說什麼都沒有，但你注意到了。",
    trigger:     { actMin: 1 },
    probability: 0.20,
    cooldownMs:  3_600_000,
    effects:     [{ type: "notification", message: "有人似乎對你知道的事情感到不安——繼續追問。" }],
  },
  {
    id:          "random_witness_appears",
    type:        "random",
    title:       "意外目擊者",
    description: "有人主動來找你，說他看到了什麼。但他很快又說，他可能記錯了。",
    trigger:     { actMin: 2, visitedScene: "crime_scene" },
    probability: 0.18,
    cooldownMs:  7_200_000,
    once:        true,
    effects:     [{ type: "clue_hint", hint: "有目擊者說在案發當晚看到有人從犯罪現場離開，方向是碼頭。" }],
  },
  {
    id:          "random_evidence_missing",
    type:        "random",
    title:       "線索消失",
    description: "你之前記得某個地方有個東西，現在不見了。可能是你記錯了，也可能不是。",
    trigger:     { actMin: 2, actMax: 3 },
    probability: 0.10,
    cooldownMs:  14_400_000,
    effects:     [
      { type: "notification", message: "某個線索的位置和你記得的不一樣——有人動過那裡的東西。" },
      { type: "ap_drain",     amount: 1 },
    ],
  },
  {
    id:          "random_ev_dream",
    type:        "random",
    title:       "夢境碎片",
    description: "你在某個場景停下來，突然閃過一段不像是你記憶的畫面。",
    trigger:     { evMin: 30, identityOnly: "phase2" },
    probability: 0.25,
    cooldownMs:  3_600_000,
    effects:     [
      { type: "ev_increase", amount: 3 },
      { type: "clue_hint",   hint: "你看到了一個地方，你知道自己從來沒去過——但你記得那個氣味。" },
    ],
  },
];
