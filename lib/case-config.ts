/**
 * 案件配置 — 所有嫌疑人、動機方向、組合規則的靜態定義
 * 資料來源：phase0/docs/compatibility-matrix.md
 */

// ── 動機方向 ──────────────────────────────────────────────────
export type MotiveDirection = "A" | "B" | "C" | "D";

export interface MotiveDefinition {
  id: MotiveDirection;
  name: string;
  description: string;
}

export const MOTIVES: Record<MotiveDirection, MotiveDefinition> = {
  A: {
    id: "A",
    name: "倖存者清算",
    description: "案件是對過去某事件的報復，兇手認為失蹤者是那次事件的共犯或受益者。",
  },
  B: {
    id: "B",
    name: "滅口者",
    description: "失蹤者掌握了某個不能公開的秘密，兇手受命或自發消除目擊者。",
  },
  C: {
    id: "C",
    name: "實驗失敗品",
    description: "失蹤者曾是第二相體覺醒實驗的參與者，兇手在清除不穩定的覺醒殘留。",
  },
  D: {
    id: "D",
    name: "扭曲崇拜",
    description: "兇手以扭曲的儀式邏輯行事，相信失蹤者「不配」見證林淵的覺醒。",
  },
};

// ── 嫌疑人 ────────────────────────────────────────────────────
export type KillerId =
  | "hanzhuo"
  | "yushuang"
  | "zhengbo"
  | "it"
  | "baiqiu"
  | "zhuanghe"
  | "linzhixia"
  | "taosheng";

export interface SuspectDefinition {
  id: KillerId;
  name: string;
  role: string;
  description: string;
  /** 本局中，這個嫌疑人在哪個 NPC 的對話裡能留下線索（NPC ID） */
  clueHolders: string[];
}

export const SUSPECTS: Record<KillerId, SuspectDefinition> = {
  hanzhuo: {
    id: "hanzhuo",
    name: "韓卓",
    role: "法醫助理",
    description: "那晚被叫去處理現場，看見了不該看見的東西，被要求簽保密協議。",
    clueHolders: ["chen_jie"],
  },
  yushuang: {
    id: "yushuang",
    name: "余霜",
    role: "兒科護士",
    description: "對林淵的情感早已超出正常護患關係，相信失蹤者是「不配見證林淵覺醒的人」。",
    clueHolders: ["chen_jie"],
  },
  zhengbo: {
    id: "zhengbo",
    name: "鄭博",
    role: "保險理賠員",
    description: "他的妻子是連環案第一個受害者，他自己調查後清算當晚所有相關者。",
    clueHolders: ["chen_jie"],
  },
  it: {
    id: "it",
    name: "「它」",
    role: "身份不明",
    description: "「它」本身就是那晚出錯的覺醒者，沒有人類意義上的動機，只是在找某樣東西。",
    clueHolders: ["chen_jie"],
  },
  baiqiu: {
    id: "baiqiu",
    name: "白秋",
    role: "藥局藥師",
    description: "雙動機角色：她的弟弟是知情者後成受害者，或她被某勢力利用藥學知識消除知情者。",
    clueHolders: ["chen_jie"],
  },
  zhuanghe: {
    id: "zhuanghe",
    name: "莊河",
    role: "退休刑警",
    description: "知道案件被移交的真相，在清除所有可能讓真相重見天日的人。",
    clueHolders: ["chen_jie"],
  },
  linzhixia: {
    id: "linzhixia",
    name: "林知夏",
    role: "生物系學生",
    description: "崇拜的不是林淵這個人，而是林淵覺醒那一刻代表的意義，用儀式感重現那晚。",
    clueHolders: ["chen_jie"],
  },
  taosheng: {
    id: "taosheng",
    name: "陶生",
    role: "建築工地領班",
    description: "他本人也是不知情的覺醒者，「兇手」的身份是無意識行為，道德層面是受害者。",
    clueHolders: ["chen_jie"],
  },
};

// ── 兼容性矩陣（直接從 compatibility-matrix.md 轉錄）──────────
export const COMPATIBILITY: Record<KillerId, Record<MotiveDirection, boolean>> = {
  hanzhuo:   { A: false, B: true,  C: false, D: false },
  yushuang:  { A: false, B: false, C: false, D: true  },
  zhengbo:   { A: true,  B: false, C: false, D: false },
  it:        { A: false, B: false, C: true,  D: false },
  baiqiu:    { A: true,  B: true,  C: false, D: false },
  zhuanghe:  { A: false, B: true,  C: false, D: false },
  linzhixia: { A: false, B: false, C: false, D: true  },
  taosheng:  { A: false, B: false, C: true,  D: false },
} as const;

// ── 禁止同局共存的組合 ────────────────────────────────────────
export const FORBIDDEN_PAIRS: [KillerId, KillerId][] = [
  ["yushuang", "linzhixia"], // 雙方向 D
  ["it",       "taosheng"],  // 雙方向 C
  ["hanzhuo",  "zhuanghe"],  // 雙方向 B 且行動模式衝突
];

// 白秋配方向 B 時必須同時有的輔助元素
export const REQUIRED_ELEMENTS: Partial<Record<KillerId, Partial<Record<MotiveDirection, string[]>>>> = {
  baiqiu: { B: ["element_05"] },
};

// ── 真相字串輔助元素 ─────────────────────────────────────────
export type RelationshipCode = "R1"|"R2"|"R3"|"R4"|"R5"|"R6"|"R7"|"R8"|"R9"|"R10"|"R11"|"R12";
export type TruthElementCode = "D1"|"D2"|"D3"|"D4"|"D5"|"D6"|"D7"|"D8"|"D9"|"D10"|"D11"|"D12";

export const RELATIONSHIPS: RelationshipCode[] = [
  "R1","R2","R3","R4","R5","R6","R7","R8","R9","R10","R11","R12",
];
export const TRUTH_ELEMENTS: TruthElementCode[] = [
  "D1","D2","D3","D4","D5","D6","D7","D8","D9","D10","D11","D12",
];

// ── 案件配置（隨機引擎的輸出）────────────────────────────────
export interface CaseConfig {
  killerId: KillerId;
  motiveDirection: MotiveDirection;
  relationship: RelationshipCode;
  elements: [TruthElementCode] | [TruthElementCode, TruthElementCode];
  truthString: string;         // 例：P3A1B2-7788-3-R7-D2-M1E3
  seed: number;
  generatedAt: string;         // ISO timestamp
}

// ── 輔助：所有合法的 killer+motive 對 ────────────────────────
export function getAllValidPairs(): { killerId: KillerId; motive: MotiveDirection }[] {
  const pairs: { killerId: KillerId; motive: MotiveDirection }[] = [];
  for (const [kid, motiveMap] of Object.entries(COMPATIBILITY) as [KillerId, Record<MotiveDirection, boolean>][]) {
    for (const [motive, valid] of Object.entries(motiveMap) as [MotiveDirection, boolean][]) {
      if (valid) pairs.push({ killerId: kid, motive });
    }
  }
  return pairs;
}

// 合法對共幾種：1+1+1+1+2+1+1+1 = 9 對
// × 12 關係 × (12 + 66) 元素組合 ≈ 29,952+
export const TOTAL_VALID_PAIRS = getAllValidPairs().length; // 9
