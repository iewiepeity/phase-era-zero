/**
 * 難度定義
 *
 * 四個難度等級：劇情模式、普通、難、極難。
 * 難度影響：線索可見性、NPC 說謊機率、時間壓力、死亡機率。
 */

/** DB 允許值：'easy' | 'normal' | 'hard'；'nightmare' 為前端擴展，寫 DB 時對應 'hard' */
export type DifficultyId = "easy" | "normal" | "hard" | "nightmare";

export interface DifficultyDef {
  id:              DifficultyId;
  name:            string;
  subtitle:        string;
  description:     string;
  traits:          string[];
  accentColor:     string;
  borderColor:     string;
  bgColor:         string;
  /** 0–1：NPC 對敏感問題的閃避率（0 = 從不閃避；1 = 總是閃避）*/
  npcEvasionRate:  number;
  /** 0–1：兇手 NPC 主動說謊的機率（覆蓋 clue 邏輯）*/
  killerLieRate:   number;
  /** 線索揭露時是否自動標記在 UI 上 */
  autoMarkClues:   boolean;
}

export const DIFFICULTIES: DifficultyDef[] = [
  {
    id:             "easy",
    name:           "劇情模式",
    subtitle:       "Story Mode",
    description:    "跟著故事走就好。線索會自動標記，NPC 說的話都是真的，不用擔心答錯。",
    traits: [
      "線索揭露時自動標記",
      "NPC 不閃避，不說謊",
      "適合第一次進入這個城市的人",
    ],
    accentColor:    "#4ade80",
    borderColor:    "rgba(74,222,128,0.35)",
    bgColor:        "rgba(74,222,128,0.04)",
    npcEvasionRate: 0,
    killerLieRate:  0,
    autoMarkClues:  true,
  },
  {
    id:             "normal",
    name:           "普通",
    subtitle:       "Normal",
    description:    "NPC 有時候不想說實話。你需要自己判斷哪些話值得相信，哪些話是在打發你。",
    traits: [
      "NPC 偶爾閃避敏感問題",
      "線索需要靠對話觸發",
      "推薦初次遊玩",
    ],
    accentColor:    "#5bb8ff",
    borderColor:    "rgba(91,184,255,0.35)",
    bgColor:        "rgba(91,184,255,0.04)",
    npcEvasionRate: 0.3,
    killerLieRate:  0,
    autoMarkClues:  false,
  },
  {
    id:             "hard",
    name:           "難",
    subtitle:       "Hard",
    description:    "兇手會說謊。你需要把不同人說的話擺在一起比對，再決定誰說的是真的。",
    traits: [
      "兇手 NPC 有機率主動說謊",
      "需要從多個 NPC 交叉驗證",
      "部分線索只出現一次，錯過就沒了",
    ],
    accentColor:    "#f59e0b",
    borderColor:    "rgba(245,158,11,0.35)",
    bgColor:        "rgba(245,158,11,0.04)",
    npcEvasionRate: 0.6,
    killerLieRate:  0.4,
    autoMarkClues:  false,
  },
  {
    id:             "nightmare",
    name:           "極難",
    subtitle:       "Nightmare",
    description:    "沒有人有義務告訴你真相。包括那些看起來像是在幫你的人。",
    traits: [
      "所有 NPC 都可能閃避或誤導",
      "線索只顯示一次，不重複",
      "第二相體路線 EV 上升速度加倍",
    ],
    accentColor:    "#ff3864",
    borderColor:    "rgba(255,56,100,0.35)",
    bgColor:        "rgba(255,56,100,0.04)",
    npcEvasionRate: 0.9,
    killerLieRate:  0.8,
    autoMarkClues:  false,
  },
];

export const DEFAULT_DIFFICULTY: DifficultyId = "normal";

/** 前端 DifficultyId 對應 DB 欄位值（DB 只允許 easy/normal/hard）*/
export function toDifficultyDbValue(id: DifficultyId): "easy" | "normal" | "hard" {
  if (id === "nightmare") return "hard";
  return id;
}

export function getDifficulty(id: DifficultyId): DifficultyDef {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[1];
}
