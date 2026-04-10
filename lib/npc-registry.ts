/**
 * NPC Registry — 所有 NPC 的靜態定義
 * Phase 6：8 位 NPC 全部完成
 */

import { CHEN_JIE_BASE_PROMPT,   ACT_STATE_MAP as CHEN_JIE_ACT_STATE_MAP   } from "./content/npc-chen-jie";
import { HANZHUO_BASE_PROMPT,    HANZHUO_ACT_STATE_MAP    } from "./content/npc-hanzhuo";
import { YUSHUANG_BASE_PROMPT,   YUSHUANG_ACT_STATE_MAP   } from "./content/npc-yushuang";
import { ZHENGBO_BASE_PROMPT,    ZHENGBO_ACT_STATE_MAP    } from "./content/npc-zhengbo";
import { IT_BASE_PROMPT,         IT_ACT_STATE_MAP         } from "./content/npc-it";
import { BAIQIU_BASE_PROMPT,     BAIQIU_ACT_STATE_MAP     } from "./content/npc-baiqiu";
import { ZHUANGHE_BASE_PROMPT,   ZHUANGHE_ACT_STATE_MAP   } from "./content/npc-zhuanghe";
import { LINZHIXIA_BASE_PROMPT,  LINZHIXIA_ACT_STATE_MAP  } from "./content/npc-linzhixia";
import { TAOSHENG_BASE_PROMPT,   TAOSHENG_ACT_STATE_MAP   } from "./content/npc-taosheng";

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
  sceneId: string;          // 對應 scene-config.ts 的 id
  basePrompt: string;
  actStateMap: Record<number, string>;
  clues: Clue[];
  trustIncrement: {
    default: number;
    friendly: number;
    goodbye: number;
  };
}

// ── 幕次心理狀態地圖（re-export from content，供外部使用）───────
export const ACT_STATE_MAP = CHEN_JIE_ACT_STATE_MAP;

// ── 陳姐靜態線索（作為 fallback；動態線索由 buildChenJieClues 生成）──
const CHEN_JIE_CLUES: Clue[] = [
  {
    id: "clue_chen_jie_01",
    content:
      "那個失蹤的人上個月還在你這裡吃飯，吃完走的時候往反方向走了——那個方向沒有他家，也沒有他上班的地方。",
    triggerCondition: { minAffinity: 30, requiredAct: 1, behaviorTrigger: "fed_full_meal_and_thanked" },
    priority: "critical",
  },
  {
    id: "clue_chen_jie_02",
    content:
      "那個人走之前，有人在外面等他。等的人我沒看清臉，但那個人一出去，兩個人就往暗巷方向走。",
    triggerCondition: { minAffinity: 60, requiredAct: 2, notBefore: ["clue_chen_jie_01"] },
    priority: "major",
  },
];

// ── NPC 總登錄表 ────────────────────────────────────────────────
export const NPC_REGISTRY: Record<string, NpcDefinition> = {
  // ── 陳姐麵館 ──────────────────────────────────────────────────
  chen_jie: {
    id: "chen_jie",
    name: "陳姐",
    location: "賽德里斯中城區麵館",
    sceneId: "chen_jie_noodles",
    basePrompt: CHEN_JIE_BASE_PROMPT,
    actStateMap: CHEN_JIE_ACT_STATE_MAP,
    clues: CHEN_JIE_CLUES,
    trustIncrement: { default: 5, friendly: 10, goodbye: 15 },
  },
  zhengbo: {
    id: "zhengbo",
    name: "鄭博",
    location: "陳姐麵館",
    sceneId: "chen_jie_noodles",
    basePrompt: ZHENGBO_BASE_PROMPT,
    actStateMap: ZHENGBO_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 4, friendly: 8, goodbye: 12 },
  },
  baiqiu: {
    id: "baiqiu",
    name: "白秋",
    location: "陳姐麵館附近藥局",
    sceneId: "chen_jie_noodles",
    basePrompt: BAIQIU_BASE_PROMPT,
    actStateMap: BAIQIU_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 3, friendly: 7, goodbye: 10 },
  },

  // ── 案發現場 ──────────────────────────────────────────────────
  hanzhuo: {
    id: "hanzhuo",
    name: "韓卓",
    location: "案發現場周邊",
    sceneId: "crime_scene",
    basePrompt: HANZHUO_BASE_PROMPT,
    actStateMap: HANZHUO_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 3, friendly: 7, goodbye: 10 },
  },
  linzhixia: {
    id: "linzhixia",
    name: "林知夏",
    location: "案發現場",
    sceneId: "crime_scene",
    basePrompt: LINZHIXIA_BASE_PROMPT,
    actStateMap: LINZHIXIA_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 6, friendly: 12, goodbye: 8 },
  },

  // ── 霧港碼頭 ──────────────────────────────────────────────────
  zhuanghe: {
    id: "zhuanghe",
    name: "莊河",
    location: "霧港碼頭茶攤",
    sceneId: "foggy_port",
    basePrompt: ZHUANGHE_BASE_PROMPT,
    actStateMap: ZHUANGHE_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 3, friendly: 6, goodbye: 12 },
  },
  taosheng: {
    id: "taosheng",
    name: "陶生",
    location: "霧港碼頭工地",
    sceneId: "foggy_port",
    basePrompt: TAOSHENG_BASE_PROMPT,
    actStateMap: TAOSHENG_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 7, friendly: 14, goodbye: 10 },
  },

  // ── 第九分局 ──────────────────────────────────────────────────
  yushuang: {
    id: "yushuang",
    name: "余霜",
    location: "第九分局走廊",
    sceneId: "ninth_precinct",
    basePrompt: YUSHUANG_BASE_PROMPT,
    actStateMap: YUSHUANG_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 5, friendly: 9, goodbye: 11 },
  },
  it: {
    id: "it",
    name: "謝先生",
    location: "第九分局",
    sceneId: "ninth_precinct",
    basePrompt: IT_BASE_PROMPT,
    actStateMap: IT_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 4, friendly: 8, goodbye: 8 },
  },
};

export function getNpc(npcId: string): NpcDefinition | null {
  return NPC_REGISTRY[npcId] ?? null;
}

/** 取得特定場景內所有 NPC */
export function getNpcsByScene(sceneId: string): NpcDefinition[] {
  return Object.values(NPC_REGISTRY).filter((n) => n.sceneId === sceneId);
}
