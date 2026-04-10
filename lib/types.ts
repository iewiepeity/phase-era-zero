/**
 * 共用型別定義 — 前後端共享的核心型別
 * 匯入這裡的型別，避免在各模組之間重複定義。
 */

export type { KillerId, MotiveDirection, CaseConfig } from "./case-config";
export type { NpcState, PlayerStats, BuildNpcPromptParams } from "./npc-engine";
export type { Clue, ClueCondition, NpcDefinition } from "./npc-registry";

// ── Chat API 訊息格式 ──────────────────────────────────────────

/** 對話訊息（前後端共用）*/
export interface ChatMessage {
  role: "user" | "npc";
  content: string;
}

/** 訊息在 Supabase chat_messages 表中的格式 */
export interface DbChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// ── NPC 狀態 ───────────────────────────────────────────────────

/** NPC 狀態在 Supabase npc_states 表中的格式 */
export interface DbNpcState {
  trust_level: number;
  clues_revealed: string[];
  conversation_count: number;
}

/** NPC 狀態供 UI 顯示使用 */
export interface NpcStateUI {
  trustLevel: number;
  conversationCount: number;
}

/** NPC 色彩配置（對話頁面用）*/
export interface NpcColorConfig {
  dot: string;
  bubble: string;
  border: string;
}

// ── 遊戲結局 ──────────────────────────────────────────────────

/** /api/game/accuse 回傳的完整結果 */
export interface AccuseResult {
  correct: boolean;
  killerCorrect: boolean;
  motiveCorrect: boolean;
  score: number;
  result: "win" | "lose";
  answer: {
    killerId: import("./case-config").KillerId;
    motiveDirection: import("./case-config").MotiveDirection;
  };
}

// ── UI 專用訊息格式（含打字機狀態）─────────────────────────────

/** 對話頁面的訊息物件（含打字機動畫狀態）*/
export interface UiMessage {
  id: string;
  role: "user" | "npc";
  content: string;
  createdAt: Date;
  isTyping?: boolean;
  typedLength?: number;
  isNew?: boolean;
}

// ── 錯誤種類 ───────────────────────────────────────────────────

/** Chat API 回傳的錯誤種類 */
export type ChatErrorKind = "rate_limit" | "server_error" | "network" | null;
