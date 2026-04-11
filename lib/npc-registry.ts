/**
 * NPC Registry — 所有 NPC 的靜態定義
 * Phase 8：23 位 NPC（9 嫌疑人 + 14 一般 NPC，含 4 位玩家相關）
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
import { GUARD_BASE_PROMPT,      GUARD_ACT_STATE_MAP      } from "./content/npc-guard";
import { REPORTER_BASE_PROMPT,   REPORTER_ACT_STATE_MAP   } from "./content/npc-reporter";
import { NEIGHBOR_BASE_PROMPT,   NEIGHBOR_ACT_STATE_MAP   } from "./content/npc-neighbor";
import { CLERK_BASE_PROMPT,      CLERK_ACT_STATE_MAP      } from "./content/npc-clerk";
import { TAXI_DRIVER_BASE_PROMPT, TAXI_DRIVER_ACT_STATE_MAP } from "./content/npc-taxi-driver";
import { PROFESSOR_BASE_PROMPT,  PROFESSOR_ACT_STATE_MAP  } from "./content/npc-professor";
import { BARTENDER_BASE_PROMPT,  BARTENDER_ACT_STATE_MAP  } from "./content/npc-bartender";
import { HOMELESS_BASE_PROMPT,   HOMELESS_ACT_STATE_MAP   } from "./content/npc-homeless";
import { VENDOR_BASE_PROMPT,     VENDOR_ACT_STATE_MAP     } from "./content/npc-vendor";
import { MORTICIAN_BASE_PROMPT,  MORTICIAN_ACT_STATE_MAP  } from "./content/npc-mortician";
import { PLAYER_NEIGHBOR_BASE_PROMPT, PLAYER_NEIGHBOR_ACT_STATE_MAP } from "./content/npc-player-neighbor";
import { ROOMMATE_BASE_PROMPT,   ROOMMATE_ACT_STATE_MAP   } from "./content/npc-roommate";
import { LAWYER_BASE_PROMPT,     LAWYER_ACT_STATE_MAP     } from "./content/npc-lawyer";
import { OLD_FRIEND_BASE_PROMPT, OLD_FRIEND_ACT_STATE_MAP } from "./content/npc-old-friend";

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
  isSuspect: boolean;       // true = 可被指控的嫌疑人；false = 一般 NPC
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

  // ════ 嫌疑人（isSuspect: true）════════════════════════════════

  // ── 陳姐麵館 ──────────────────────────────────────────────────
  chen_jie: {
    id: "chen_jie",
    name: "陳姐",
    location: "賽德里斯中城區麵館",
    sceneId: "chen_jie_noodles",
    isSuspect: false,
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
    isSuspect: true,
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
    isSuspect: true,
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
    isSuspect: true,
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
    isSuspect: true,
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
    isSuspect: true,
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
    isSuspect: true,
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
    isSuspect: true,
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
    isSuspect: true,
    basePrompt: IT_BASE_PROMPT,
    actStateMap: IT_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 4, friendly: 8, goodbye: 8 },
  },

  // ════ 一般 NPC（isSuspect: false）══════════════════════════════

  // ── BTMA 大廳 ─────────────────────────────────────────────────
  guard: {
    id: "guard",
    name: "老陳",
    location: "BTMA 機構大廳／第九分局",
    sceneId: "btma_lobby",
    isSuspect: false,
    basePrompt: GUARD_BASE_PROMPT,
    actStateMap: GUARD_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 3, friendly: 6, goodbye: 8 },
  },

  // ── 案發現場 ──────────────────────────────────────────────────
  reporter: {
    id: "reporter",
    name: "蘇磊",
    location: "案發現場附近",
    sceneId: "crime_scene",
    isSuspect: false,
    basePrompt: REPORTER_BASE_PROMPT,
    actStateMap: REPORTER_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 4, friendly: 9, goodbye: 7 },
  },

  // ── 陳姐麵館附近（老城區）──────────────────────────────────────
  neighbor: {
    id: "neighbor",
    name: "林太太",
    location: "老城區街坊",
    sceneId: "chen_jie_noodles",
    isSuspect: false,
    basePrompt: NEIGHBOR_BASE_PROMPT,
    actStateMap: NEIGHBOR_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 4, friendly: 8, goodbye: 10 },
  },

  // ── 白秋藥局附近（老城商業區）──────────────────────────────────
  clerk: {
    id: "clerk",
    name: "小劉",
    location: "藥局旁便利商店",
    sceneId: "bai_qiu_pharmacy",
    isSuspect: false,
    basePrompt: CLERK_BASE_PROMPT,
    actStateMap: CLERK_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 5, friendly: 10, goodbye: 6 },
  },

  // ── 霧港碼頭 ──────────────────────────────────────────────────
  taxi_driver: {
    id: "taxi_driver",
    name: "魏師傅",
    location: "霧港碼頭停車帶",
    sceneId: "foggy_port",
    isSuspect: false,
    basePrompt: TAXI_DRIVER_BASE_PROMPT,
    actStateMap: TAXI_DRIVER_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 4, friendly: 8, goodbye: 9 },
  },

  // ── 大學研究室 ────────────────────────────────────────────────
  professor: {
    id: "professor",
    name: "方教授",
    location: "賽德里斯大學研究室",
    sceneId: "lin_lab",
    isSuspect: false,
    basePrompt: PROFESSOR_BASE_PROMPT,
    actStateMap: PROFESSOR_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 3, friendly: 7, goodbye: 10 },
  },

  // ── 老城區茶酒室 ──────────────────────────────────────────────
  bartender: {
    id: "bartender",
    name: "老秦",
    location: "老城區茶酒室",
    sceneId: "bai_qiu_pharmacy",
    isSuspect: false,
    basePrompt: BARTENDER_BASE_PROMPT,
    actStateMap: BARTENDER_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 4, friendly: 9, goodbye: 8 },
  },

  // ── 案發現場周邊（街友）──────────────────────────────────────
  homeless: {
    id: "homeless",
    name: "老默",
    location: "案發現場／碼頭邊緣",
    sceneId: "crime_scene",
    isSuspect: false,
    basePrompt: HOMELESS_BASE_PROMPT,
    actStateMap: HOMELESS_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 2, friendly: 6, goodbye: 5 },
  },

  // ── 老城區夜市（攤販）────────────────────────────────────────
  vendor: {
    id: "vendor",
    name: "大姐",
    location: "老城區夜市",
    sceneId: "chen_jie_noodles",
    isSuspect: false,
    basePrompt: VENDOR_BASE_PROMPT,
    actStateMap: VENDOR_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 5, friendly: 10, goodbye: 7 },
  },

  // ── 中央醫療院太平間 ──────────────────────────────────────────
  mortician: {
    id: "mortician",
    name: "老吳",
    location: "中央醫療院太平間",
    sceneId: "medical_center",
    isSuspect: false,
    basePrompt: MORTICIAN_BASE_PROMPT,
    actStateMap: MORTICIAN_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 3, friendly: 7, goodbye: 9 },
  },

  // ── 玩家住所（同棟鄰居）──────────────────────────────────────
  player_neighbor: {
    id: "player_neighbor",
    name: "陳太太",
    location: "玩家住所同層走廊",
    sceneId: "chen_jie_noodles",
    isSuspect: false,
    basePrompt: PLAYER_NEIGHBOR_BASE_PROMPT,
    actStateMap: PLAYER_NEIGHBOR_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 4, friendly: 8, goodbye: 10 },
  },

  // ── 玩家室友 ──────────────────────────────────────────────────
  roommate: {
    id: "roommate",
    name: "阿傑",
    location: "玩家住所／附近咖啡廳",
    sceneId: "bai_qiu_pharmacy",
    isSuspect: false,
    basePrompt: ROOMMATE_BASE_PROMPT,
    actStateMap: ROOMMATE_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 5, friendly: 11, goodbye: 9 },
  },

  // ── 辯護律師 ──────────────────────────────────────────────────
  lawyer: {
    id: "lawyer",
    name: "嚴律師",
    location: "第九分局走廊／律師事務所",
    sceneId: "ninth_precinct",
    isSuspect: false,
    basePrompt: LAWYER_BASE_PROMPT,
    actStateMap: LAWYER_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 4, friendly: 8, goodbye: 12 },
  },

  // ── 前同事 ────────────────────────────────────────────────────
  old_friend: {
    id: "old_friend",
    name: "阿文",
    location: "中城區咖啡廳",
    sceneId: "zhengbo_office",
    isSuspect: false,
    basePrompt: OLD_FRIEND_BASE_PROMPT,
    actStateMap: OLD_FRIEND_ACT_STATE_MAP,
    clues: [],
    trustIncrement: { default: 6, friendly: 12, goodbye: 10 },
  },
};

export function getNpc(npcId: string): NpcDefinition | null {
  return NPC_REGISTRY[npcId] ?? null;
}

/** 取得特定場景內所有 NPC */
export function getNpcsByScene(sceneId: string): NpcDefinition[] {
  return Object.values(NPC_REGISTRY).filter((n) => n.sceneId === sceneId);
}

/** 取得所有嫌疑人（指控頁面用） */
export function getSuspects(): NpcDefinition[] {
  return Object.values(NPC_REGISTRY).filter((n) => n.isSuspect);
}
