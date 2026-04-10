/**
 * Random Engine — 每局案件隨機生成
 * 功能：seed-based 隨機 + 兼容性驗證 + 真相字串生成
 */

import {
  type KillerId,
  type MotiveDirection,
  type RelationshipCode,
  type TruthElementCode,
  type CaseConfig,
  COMPATIBILITY,
  FORBIDDEN_PAIRS,
  REQUIRED_ELEMENTS,
  SUSPECTS,
  RELATIONSHIPS,
  TRUTH_ELEMENTS,
  getAllValidPairs,
} from "./case-config";

// ── Seed-based 偽隨機（mulberry32）────────────────────────────
// 純函式，不依賴 Math.random()，可重現
function mulberry32(seed: number) {
  return function (): number {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickRandom<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function pickN<T>(arr: T[], n: number, rand: () => number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(rand() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

// ── 驗證函式（也供單元測試使用）──────────────────────────────

/** 驗證 killer + motive 是否合法 */
export function isValidPair(killerId: KillerId, motive: MotiveDirection): boolean {
  return COMPATIBILITY[killerId][motive] === true;
}

/** 驗證兩位嫌疑人是否為禁止共存組合（單局禁用，本遊戲只有一位兇手，留作擴展用） */
export function isForbiddenPair(a: KillerId, b: KillerId): boolean {
  return FORBIDDEN_PAIRS.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a)
  );
}

/** 驗證 CaseConfig 的完整合法性 */
export function validateCase(config: CaseConfig): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (!isValidPair(config.killerId, config.motiveDirection)) {
    reasons.push(
      `兇手 ${config.killerId} 與動機 ${config.motiveDirection} 不相容`
    );
  }

  const required = REQUIRED_ELEMENTS[config.killerId]?.[config.motiveDirection] ?? [];
  for (const req of required) {
    if (!config.elements.includes(req as TruthElementCode)) {
      reasons.push(`兇手 ${config.killerId} + 動機 ${config.motiveDirection} 需要輔助元素 ${req}`);
    }
  }

  if (!RELATIONSHIPS.includes(config.relationship)) {
    reasons.push(`關係代碼 ${config.relationship} 不存在`);
  }

  return { valid: reasons.length === 0, reasons };
}

// ── 真相字串格式：P{route}{killer_idx}{motive}-{mmdd}-{act}-{rel}-{elem1}{elem2} ──
// 例：PA3B-0410-1-R7-D2M5
// Phase 3 完整版格式留作 Phase 3 說明，此處用簡化版供 MVP 使用
function buildTruthString(
  killerId: KillerId,
  motive: MotiveDirection,
  relationship: RelationshipCode,
  elements: CaseConfig["elements"],
  seed: number
): string {
  const killerIdx = Object.keys(SUSPECTS).indexOf(killerId) + 1;
  const date = new Date();
  const mmdd = String(date.getMonth() + 1).padStart(2, "0") +
               String(date.getDate()).padStart(2, "0");
  const elemStr = elements.join("");
  return `P${motive}${killerIdx}${motive}-${mmdd}-${seed % 9999}-${relationship}-${elemStr}`;
}

// ── 主函式：generateCase() ────────────────────────────────────
export interface GenerateCaseOptions {
  seed?: number;
  forceKiller?: KillerId;
  forceMotive?: MotiveDirection;
}

export function generateCase(options: GenerateCaseOptions = {}): CaseConfig {
  const seed = options.seed ?? (Date.now() ^ (Math.random() * 0x100000000));
  const rand = mulberry32(seed);

  // 1. 從所有合法 killer+motive 對中隨機選一個
  const validPairs = getAllValidPairs();

  let filtered = validPairs;
  if (options.forceKiller) {
    filtered = filtered.filter((p) => p.killerId === options.forceKiller);
  }
  if (options.forceMotive) {
    filtered = filtered.filter((p) => p.motive === options.forceMotive);
  }
  if (filtered.length === 0) {
    throw new Error(
      `無合法組合：killer=${options.forceKiller}, motive=${options.forceMotive}`
    );
  }

  const chosen = pickRandom(filtered, rand);
  const { killerId, motive: motiveDirection } = chosen;

  // 2. 隨機選關係代碼
  const relationship = pickRandom(RELATIONSHIPS, rand) as RelationshipCode;

  // 3. 隨機選 1–2 個真相輔助元素
  // 白秋 + B 必須包含 element_05（轉為 D5）
  const requiredElems = (REQUIRED_ELEMENTS[killerId]?.[motiveDirection] ?? []) as TruthElementCode[];
  const pool = TRUTH_ELEMENTS.filter((e) => !requiredElems.includes(e));
  const extraCount = Math.floor(rand() * 2); // 0 或 1 個額外元素
  const extraElems = pickN(pool, extraCount, rand) as TruthElementCode[];
  const elements = [...requiredElems, ...extraElems] as CaseConfig["elements"];
  const safeElements: CaseConfig["elements"] = elements.length > 0
    ? elements as CaseConfig["elements"]
    : [pickRandom(TRUTH_ELEMENTS, rand) as TruthElementCode];

  // 4. 組裝
  const truthString = buildTruthString(killerId, motiveDirection, relationship, safeElements, seed);

  const config: CaseConfig = {
    killerId,
    motiveDirection,
    relationship,
    elements: safeElements,
    truthString,
    seed,
    generatedAt: new Date().toISOString(),
  };

  // 5. 最終驗證（防禦性）
  const { valid, reasons } = validateCase(config);
  if (!valid) {
    throw new Error(`generateCase 產生了非法組合：${reasons.join("; ")}`);
  }

  return config;
}

// ── NPC 線索注入：根據案件配置產生陳姐的動態線索 ──────────────
// Phase 3 完整版會有每個 NPC 的動態線索庫；
// Phase 2/3 MVP 先對陳姐實作

import type { Clue } from "./npc-registry";

interface ClueTemplate {
  id: string;
  killerFilter?: KillerId[];   // 只適用於這些兇手（undefined = 通用）
  motiveFilter?: MotiveDirection[];
  contentFn: (config: CaseConfig) => string;
  priority: "critical" | "major" | "minor";
  minAffinity: number;
  requiredAct: number;
  behaviorTrigger?: string;
  notBefore?: string[];
}

const CHEN_JIE_CLUE_TEMPLATES: ClueTemplate[] = [
  // 通用線索：失蹤者走錯方向（適用所有組合）
  {
    id: "cj_direction",
    contentFn: () =>
      "那個失蹤的人上個月還在你這裡吃飯，吃完走的時候往反方向走了——那個方向沒有他家，也沒有他上班的地方。",
    priority: "critical",
    minAffinity: 30,
    requiredAct: 1,
    behaviorTrigger: "fed_full_meal_and_thanked",
  },
  // 動機方向 B（滅口者）：有人在等
  {
    id: "cj_watcher_B",
    motiveFilter: ["B"],
    contentFn: () =>
      "那個人走之前，有人在外面等他。等的人我沒看清臉，但那個人一出去，兩個人就往暗巷方向走。",
    priority: "major",
    minAffinity: 60,
    requiredAct: 2,
    notBefore: ["cj_direction"],
  },
  // 動機方向 A（倖存者清算）：失蹤者說過某句話
  {
    id: "cj_words_A",
    motiveFilter: ["A"],
    contentFn: () =>
      "他上次來的時候說了一句奇怪的話，說有人一直在「算帳」。我以為他在說債，後來想想不對。",
    priority: "major",
    minAffinity: 60,
    requiredAct: 2,
    notBefore: ["cj_direction"],
  },
  // 動機方向 C（實驗失敗品）：失蹤者眼神不對
  {
    id: "cj_eyes_C",
    motiveFilter: ["C"],
    contentFn: () =>
      "那個人最後幾次來，眼神不對。不是害怕，是那種……找什麼東西找到一半、快找到了、又怕找到的那種。",
    priority: "major",
    minAffinity: 60,
    requiredAct: 2,
    notBefore: ["cj_direction"],
  },
  // 動機方向 D（扭曲崇拜）：失蹤者拿過一張紙
  {
    id: "cj_paper_D",
    motiveFilter: ["D"],
    contentFn: () =>
      "失蹤前三天，他來吃飯，有人給他塞了一張紙。他看完臉色變了，但沒說什麼，就付錢走了。",
    priority: "major",
    minAffinity: 60,
    requiredAct: 2,
    notBefore: ["cj_direction"],
  },
  // 韓卓專屬：法醫制服
  {
    id: "cj_medical_hanzhuo",
    killerFilter: ["hanzhuo"],
    contentFn: (cfg) =>
      `你後來想起來，那個在外面等的人穿著很整齊，像是什麼制服，但不是警察。（兇手：${cfg.killerId}，僅供除錯）`,
    priority: "minor",
    minAffinity: 80,
    requiredAct: 3,
    notBefore: ["cj_watcher_B"],
  },
  // 莊河專屬：認出是警察
  {
    id: "cj_cop_zhuanghe",
    killerFilter: ["zhuanghe"],
    contentFn: () =>
      "等的那個人……我後來才想起來，他以前也來過這裡。警察，退休的那種，舉止你認得出來。",
    priority: "minor",
    minAffinity: 80,
    requiredAct: 3,
    notBefore: ["cj_watcher_B"],
  },
];

/** 根據 CaseConfig 為陳姐產生這局的動態線索清單 */
export function buildChenJieClues(config: CaseConfig): Clue[] {
  return CHEN_JIE_CLUE_TEMPLATES
    .filter((t) => {
      if (t.killerFilter && !t.killerFilter.includes(config.killerId)) return false;
      if (t.motiveFilter && !t.motiveFilter.includes(config.motiveDirection)) return false;
      return true;
    })
    .map((t): Clue => ({
      id: t.id,
      content: t.contentFn(config),
      priority: t.priority,
      triggerCondition: {
        minAffinity: t.minAffinity,
        requiredAct: t.requiredAct,
        behaviorTrigger: t.behaviorTrigger,
        notBefore: t.notBefore,
      },
    }));
}
