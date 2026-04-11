/**
 * Random Engine — 每局案件隨機生成
 * 功能：seed-based 隨機 + 兼容性驗證 + 真相字串生成
 */

import {
  type KillerId,
  type MotiveDirection,
  type SubMotiveId,
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
  getSubMotivesForDirection,
} from "./case-config";

import type { Clue }              from "./npc-registry";
import { buildRedHerringClues }  from "./content/red-herrings";
import { buildChenJieClues }   from "./content/clues-chen-jie";
import { buildHanzhuoClues }   from "./content/clues-hanzhuo";
import { buildYushuangClues }  from "./content/clues-yushuang";
import { buildZhengboClues }   from "./content/clues-zhengbo";
import { buildItClues }        from "./content/clues-it";
import { buildBaiqiuClues }    from "./content/clues-baiqiu";
import { buildZhuangheClues }  from "./content/clues-zhuanghe";
import { buildLinzhixiaClues } from "./content/clues-linzhixia";
import { buildTaoshengClues }  from "./content/clues-taosheng";

export { buildChenJieClues };
export { buildHanzhuoClues };
export { buildYushuangClues };
export { buildZhengboClues };
export { buildItClues };
export { buildBaiqiuClues };
export { buildZhuangheClues };
export { buildLinzhixiaClues };
export { buildTaoshengClues };

/** 根據 npcId + CaseConfig 產生對應 NPC 的動態線索（真實線索 + 紅鯡魚） */
export function buildNpcClues(npcId: string, config: CaseConfig): Clue[] {
  const realClues: Clue[] = (() => {
    switch (npcId) {
      case "chen_jie":  return buildChenJieClues(config);
      case "hanzhuo":   return buildHanzhuoClues(config);
      case "yushuang":  return buildYushuangClues(config);
      case "zhengbo":   return buildZhengboClues(config);
      case "it":        return buildItClues(config);
      case "baiqiu":    return buildBaiqiuClues(config);
      case "zhuanghe":  return buildZhuangheClues(config);
      case "linzhixia": return buildLinzhixiaClues(config);
      case "taosheng":  return buildTaoshengClues(config);
      default:          return [];
    }
  })();

  // 兇手 NPC 不注入紅鯡魚（它已有偽裝指令，多餘且可能混淆）
  if (npcId === config.killerId) return realClues;

  // 無辜 NPC：附加 2 條紅鯡魚線索（魚目混珠）
  const herrings = buildRedHerringClues(npcId, config, 2);
  return [...realClues, ...herrings];
}

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

  if (!config.subMotiveId || !config.subMotiveId.startsWith(config.motiveDirection)) {
    reasons.push(`子動機 ${config.subMotiveId} 與動機方向 ${config.motiveDirection} 不符`);
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

// ── 真相字串格式：P{motive}{killer_idx}-{subMotive}-{mmdd}-{seed%9999}-{rel}-{elems} ──
// 例：PA3-A1-0411-5678-R7-D2
// subMotive 為第 2 段（split('-')[1]），供 accuse/route.ts 解析
function buildTruthString(
  killerId:    KillerId,
  motive:      MotiveDirection,
  subMotiveId: SubMotiveId,
  relationship: RelationshipCode,
  elements:    CaseConfig["elements"],
  seed:        number
): string {
  const killerIdx = Object.keys(SUSPECTS).indexOf(killerId) + 1;
  const date  = new Date();
  const mmdd  = String(date.getMonth() + 1).padStart(2, "0") +
                String(date.getDate()).padStart(2, "0");
  const elemStr = elements.join("");
  return `P${motive}${killerIdx}-${subMotiveId}-${mmdd}-${seed % 9999}-${relationship}-${elemStr}`;
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

  // 2b. 隨機選子動機
  const subMotiveOptions = getSubMotivesForDirection(motiveDirection);
  const subMotive        = pickRandom(subMotiveOptions, rand);
  const subMotiveId      = subMotive.id as SubMotiveId;

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
  const truthString = buildTruthString(killerId, motiveDirection, subMotiveId, relationship, safeElements, seed);

  const config: CaseConfig = {
    killerId,
    motiveDirection,
    subMotiveId,
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

// buildChenJieClues 已移至 ./content/clues-chen-jie.ts，並由上方 re-export。
