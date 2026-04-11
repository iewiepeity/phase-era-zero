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
    subtitle:       "Easy",
    description:    "沉浸在故事裡，不用擔心失敗。線索會自動標記，NPC 不說謊。",
    traits: [
      "線索揭露時自動標記",
      "NPC 不會主動閃避問題",
      "無死亡懲罰",
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
    description:    "標準體驗。NPC 有時閃避，線索需要自己辨別。",
    traits: [
      "NPC 偶爾閃避敏感問題",
      "線索需靠對話觸發",
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
    description:    "兇手 NPC 會說謊，需要交叉驗證多條線索。",
    traits: [
      "兇手 NPC 有機率主動說謊",
      "需要從多個 NPC 交叉驗證",
      "部分線索只出現一次",
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
    description:    "所有 NPC 都可能說謊。沒有提示，信任需要從零建立。",
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
