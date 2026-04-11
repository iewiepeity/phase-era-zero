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
