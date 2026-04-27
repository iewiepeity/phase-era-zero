/**
 * 全域常數 — 散落在各模組的 magic numbers、顏色值、動畫時間
 * 所有頁面和元件都從這裡取值，避免硬編碼。
 */

import type { MotiveDirection } from "./case-config";

// ── 打字機速度 ─────────────────────────────────────────────────

/** NPC 回覆逐字顯示速度（毫秒/字）*/
export const NPC_TYPING_MS = 26;

/** 開場白、場景旁白打字速度（毫秒/字）*/
export const INTRO_TYPING_MS = 20;

// ── localStorage 鍵名 ─────────────────────────────────────────

export const STORAGE_KEYS = {
  /** 訪客唯一識別碼 */
  GUEST_ID:   "pez_guest_id",
  /** 當前遊戲 Session ID */
  SESSION_ID: "pez_game_session_id",
  /** 是否已看過本局開場白 */
  SEEN_INTRO: (sessionId: string) => `pez_seen_intro_${sessionId}`,
  /** 本局結果快照（指控後存入，結局頁讀取）*/
  RESULT:     (sessionId: string) => `pez_result_${sessionId}`,
  /** 本局玩家身份（identity 頁選完後存入）*/
  IDENTITY:   (sessionId: string) => `pez_identity_${sessionId}`,
  /** 本局難度選擇（difficulty 頁選完後存入）*/
  DIFFICULTY: (sessionId: string) => `pez_difficulty_${sessionId}`,
  /** 本局已訪問場景清單（逗號分隔）*/
  VISITED_SCENES: (sessionId: string) => `pez_visited_${sessionId}`,
  /** 已解鎖成就清單（逗號分隔，跨 session 累積）*/
  ACHIEVEMENTS: "pez_achievements_all",
  /** 本局場景物件已互動清單 key: sceneId → comma-separated item IDs */
  SCENE_INTERACTED: (sessionId: string, sceneId: string) => `pez_interacted_${sessionId}_${sceneId}`,
  /** 剩餘行動點 */
  ACTION_POINTS: (sessionId: string) => `pez_ap_${sessionId}`,
  /** 最大行動點（由難度決定）*/
  MAX_ACTION_POINTS: (sessionId: string) => `pez_max_ap_${sessionId}`,
  /** 行動點耗盡後直接結束（沉默結局旗標）*/
  SILENT_ENDING: (sessionId: string) => `pez_silent_${sessionId}`,
  /** 推理筆記本資料 */
  NOTEBOOK: (sessionId: string) => `pez_notebook_${sessionId}`,
  /** 是否已看過場景探索新手教學 */
  TUTORIAL_SCENE: "pez_tutorial_scene",
  /** 是否已看過對話新手教學 */
  TUTORIAL_CHAT: "pez_tutorial_chat",
  /** 玩家自訂顯示名稱 */
  PLAYER_NAME: (sessionId: string) => `pez_name_${sessionId}`,
  /** NPC 互動態度記錄（per NPC）*/
  NPC_ATTITUDE: (sessionId: string, npcId: string) => `pez_attitude_${sessionId}_${npcId}`,
  /** 不可逆選擇後果記錄（per session）*/
  CONSEQUENCES: (sessionId: string) => `pez_consequences_${sessionId}`,
} as const;

// ── NPC 色彩配置 ───────────────────────────────────────────────

/** 各 NPC 的強調色（對話頁面用）*/
export const NPC_COLORS: Record<string, { dot: string; bubble: string; border: string }> = {
  chen_jie: {
    dot:    "#f59e0b",
    bubble: "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.18)",
  },
  hanzhuo: {
    dot:    "#5bb8ff",
    bubble: "rgba(91,184,255,0.06)",
    border: "rgba(91,184,255,0.18)",
  },
  yushuang: {
    dot:    "#c084fc",
    bubble: "rgba(192,132,252,0.06)",
    border: "rgba(192,132,252,0.18)",
  },
  zhengbo: {
    dot:    "#60a5fa",
    bubble: "rgba(96,165,250,0.06)",
    border: "rgba(96,165,250,0.18)",
  },
  it: {
    dot:    "#4ade80",
    bubble: "rgba(74,222,128,0.05)",
    border: "rgba(74,222,128,0.16)",
  },
  baiqiu: {
    dot:    "#f0abfc",
    bubble: "rgba(240,171,252,0.05)",
    border: "rgba(240,171,252,0.16)",
  },
  zhuanghe: {
    dot:    "#94a3b8",
    bubble: "rgba(148,163,184,0.05)",
    border: "rgba(148,163,184,0.16)",
  },
  linzhixia: {
    dot:    "#fb923c",
    bubble: "rgba(251,146,60,0.06)",
    border: "rgba(251,146,60,0.18)",
  },
  taosheng: {
    dot:    "#a3e635",
    bubble: "rgba(163,230,53,0.05)",
    border: "rgba(163,230,53,0.14)",
  },
  // ── 一般 NPC ──────────────────────────────────────────────────
  guard: {
    dot:    "#94a3b8",
    bubble: "rgba(148,163,184,0.05)",
    border: "rgba(148,163,184,0.15)",
  },
  reporter: {
    dot:    "#fbbf24",
    bubble: "rgba(251,191,36,0.05)",
    border: "rgba(251,191,36,0.16)",
  },
  neighbor: {
    dot:    "#f97316",
    bubble: "rgba(249,115,22,0.05)",
    border: "rgba(249,115,22,0.15)",
  },
  clerk: {
    dot:    "#34d399",
    bubble: "rgba(52,211,153,0.05)",
    border: "rgba(52,211,153,0.15)",
  },
  taxi_driver: {
    dot:    "#38bdf8",
    bubble: "rgba(56,189,248,0.05)",
    border: "rgba(56,189,248,0.15)",
  },
  professor: {
    dot:    "#a78bfa",
    bubble: "rgba(167,139,250,0.05)",
    border: "rgba(167,139,250,0.15)",
  },
  bartender: {
    dot:    "#d97706",
    bubble: "rgba(217,119,6,0.05)",
    border: "rgba(217,119,6,0.16)",
  },
  homeless: {
    dot:    "#78716c",
    bubble: "rgba(120,113,108,0.05)",
    border: "rgba(120,113,108,0.15)",
  },
  vendor: {
    dot:    "#f43f5e",
    bubble: "rgba(244,63,94,0.05)",
    border: "rgba(244,63,94,0.15)",
  },
  mortician: {
    dot:    "#64748b",
    bubble: "rgba(100,116,139,0.05)",
    border: "rgba(100,116,139,0.15)",
  },
  player_neighbor: {
    dot:    "#84cc16",
    bubble: "rgba(132,204,22,0.05)",
    border: "rgba(132,204,22,0.14)",
  },
  roommate: {
    dot:    "#22d3ee",
    bubble: "rgba(34,211,238,0.05)",
    border: "rgba(34,211,238,0.15)",
  },
  lawyer: {
    dot:    "#818cf8",
    bubble: "rgba(129,140,248,0.05)",
    border: "rgba(129,140,248,0.16)",
  },
  old_friend: {
    dot:    "#4ade80",
    bubble: "rgba(74,222,128,0.05)",
    border: "rgba(74,222,128,0.14)",
  },
};

/** 找不到指定 NPC 時的預設色 */
export const DEFAULT_NPC_COLOR = {
  dot:    "#5bb8ff",
  bubble: "rgba(91,184,255,0.06)",
  border: "rgba(91,184,255,0.15)",
};

// ── 場景卡片配色 ───────────────────────────────────────────────

/** 各場景的卡片配色（地圖頁面用）*/
export const SCENE_PALETTE: Record<string, {
  accent:      string;
  glow:        string;
  border:      string;
  borderHover: string;
  badge:       string;
}> = {
  chen_jie_noodles: {
    accent:      "#f59e0b",
    glow:        "rgba(245,158,11,0.12)",
    border:      "rgba(245,158,11,0.18)",
    borderHover: "rgba(245,158,11,0.45)",
    badge:       "rgba(245,158,11,0.15)",
  },
  crime_scene: {
    accent:      "#5bb8ff",
    glow:        "rgba(91,184,255,0.08)",
    border:      "rgba(91,184,255,0.12)",
    borderHover: "rgba(91,184,255,0.30)",
    badge:       "rgba(91,184,255,0.12)",
  },
  foggy_port: {
    accent:      "#14b8a6",
    glow:        "rgba(20,184,166,0.08)",
    border:      "rgba(20,184,166,0.12)",
    borderHover: "rgba(20,184,166,0.30)",
    badge:       "rgba(20,184,166,0.12)",
  },
  ninth_precinct: {
    accent:      "#ff3864",
    glow:        "rgba(255,56,100,0.08)",
    border:      "rgba(255,56,100,0.14)",
    borderHover: "rgba(255,56,100,0.35)",
    badge:       "rgba(255,56,100,0.12)",
  },
  bai_qiu_pharmacy: {
    accent:      "#f0abfc",
    glow:        "rgba(240,171,252,0.08)",
    border:      "rgba(240,171,252,0.14)",
    borderHover: "rgba(240,171,252,0.35)",
    badge:       "rgba(240,171,252,0.12)",
  },
  medical_center: {
    accent:      "#c084fc",
    glow:        "rgba(192,132,252,0.08)",
    border:      "rgba(192,132,252,0.14)",
    borderHover: "rgba(192,132,252,0.35)",
    badge:       "rgba(192,132,252,0.12)",
  },
  lin_lab: {
    accent:      "#fb923c",
    glow:        "rgba(251,146,60,0.08)",
    border:      "rgba(251,146,60,0.14)",
    borderHover: "rgba(251,146,60,0.35)",
    badge:       "rgba(251,146,60,0.12)",
  },
  btma_lobby: {
    accent:      "#4ade80",
    glow:        "rgba(74,222,128,0.07)",
    border:      "rgba(74,222,128,0.12)",
    borderHover: "rgba(74,222,128,0.30)",
    badge:       "rgba(74,222,128,0.10)",
  },
  abandoned_warehouse: {
    accent:      "#06b6d4",
    glow:        "rgba(6,182,212,0.08)",
    border:      "rgba(6,182,212,0.12)",
    borderHover: "rgba(6,182,212,0.30)",
    badge:       "rgba(6,182,212,0.10)",
  },
  zhengbo_office: {
    accent:      "#60a5fa",
    glow:        "rgba(96,165,250,0.08)",
    border:      "rgba(96,165,250,0.14)",
    borderHover: "rgba(96,165,250,0.35)",
    badge:       "rgba(96,165,250,0.12)",
  },
};

/** 找不到指定場景時的預設配色 */
export const DEFAULT_SCENE_PALETTE = SCENE_PALETTE.crime_scene;

// ── 動機方向顏色 ───────────────────────────────────────────────

/** 各動機方向的配色（指控頁面用）*/
export const MOTIVE_COLORS: Record<MotiveDirection, {
  border: string;
  bg:     string;
  text:   string;
  badge:  string;
}> = {
  A: { border: "rgba(91,184,255,0.40)",  bg: "rgba(91,184,255,0.06)",  text: "#5bb8ff",  badge: "rgba(91,184,255,0.15)"  },
  B: { border: "rgba(255,56,100,0.40)",  bg: "rgba(255,56,100,0.06)",  text: "#ff3864",  badge: "rgba(255,56,100,0.15)"  },
  C: { border: "rgba(74,222,128,0.35)",  bg: "rgba(74,222,128,0.05)",  text: "#4ade80",  badge: "rgba(74,222,128,0.12)"  },
  D: { border: "rgba(192,132,252,0.35)", bg: "rgba(192,132,252,0.05)", text: "#c084fc",  badge: "rgba(192,132,252,0.12)" },
};
