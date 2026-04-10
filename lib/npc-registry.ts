/**
 * NPC Registry — 所有 NPC 的靜態定義
 * Phase 2：目前只有陳姐
 * Phase 3 之後：從 Supabase npcs 表動態載入
 */

import { CHEN_JIE_BASE_PROMPT, ACT_STATE_MAP as CHEN_JIE_ACT_STATE_MAP } from "./content/npc-chen-jie";

// ── 型別（與 game-engine-spec.md 對齊）────────────────────────
export interface ClueCondition {
  minAffinity: number;      // NPC 對玩家的最低信任度門檻
  requiredAct: number;      // 最早可揭露的幕次
  behaviorTrigger?: string; // 特殊行為觸發關鍵字
  notBefore?: string[];     // 前置線索（需先取得）
}

export interface Clue {
  id: string;
  content: string;
  triggerCondition: ClueCondition;
  priority: "critical" | "major" | "minor";
}

export interface NpcDefinition {
  id: string;
  name: string;
  location: string;
  basePrompt: string;       // 人設基礎（不含情境/線索）
  actStateMap: Record<number, string>;
  clues: Clue[];
  trustIncrement: {
    default: number;        // 每輪對話基礎信任增加值
    friendly: number;       // 玩家展現善意時
    goodbye: number;        // 道謝/告別時
  };
}

// ── 幕次心理狀態地圖（re-export from content，供外部使用）───────
export const ACT_STATE_MAP = CHEN_JIE_ACT_STATE_MAP;

// ── 陳姐（chen_jie）────────────────────────────────────────────
// CHEN_JIE_BASE_PROMPT 從 ./content/npc-chen-jie 匯入

const CHEN_JIE_CLUES: Clue[] = [
  {
    id: "clue_chen_jie_01",
    content:
      "那個失蹤的人上個月還在你這裡吃飯，吃完走的時候往反方向走了——那個方向沒有他家，也沒有他上班的地方。",
    triggerCondition: {
      minAffinity: 30,
      requiredAct: 1,
      behaviorTrigger: "fed_full_meal_and_thanked",
    },
    priority: "critical",
  },
  {
    id: "clue_chen_jie_02",
    content:
      "那個人走之前，有人在外面等他。等的人我沒看清臉，但那個人一出去，兩個人就往暗巷方向走。",
    triggerCondition: {
      minAffinity: 60,
      requiredAct: 2,
      notBefore: ["clue_chen_jie_01"],
    },
    priority: "major",
  },
];

// ── NPC 總登錄表 ────────────────────────────────────────────────
export const NPC_REGISTRY: Record<string, NpcDefinition> = {
  chen_jie: {
    id: "chen_jie",
    name: "陳姐",
    location: "賽德里斯中城區麵館",
    basePrompt: CHEN_JIE_BASE_PROMPT,
    actStateMap: ACT_STATE_MAP,
    clues: CHEN_JIE_CLUES,
    trustIncrement: {
      default: 5,
      friendly: 10,
      goodbye: 15,
    },
  },
};

export function getNpc(npcId: string): NpcDefinition | null {
  return NPC_REGISTRY[npcId] ?? null;
}
