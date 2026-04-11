/**
 * Gemini 服務層 — 所有 Google Generative AI 呼叫集中於此
 * 統一處理模型初始化、歷史格式轉換、錯誤識別。
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ChatMessage } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/** 目前使用的 Gemini 模型 */
const GEMINI_MODEL = "gemini-2.5-flash";

/**
 * 呼叫 Gemini 進行 NPC 對話。
 *
 * @param systemPrompt - 由 buildNpcPrompt() 組裝的系統指令
 * @param history      - 本輪以前的對話歷史（不含最後一則）
 * @param userMessage  - 玩家剛送出的訊息
 * @returns NPC 的回覆文字
 * @throws 若 Gemini 回傳 429（rate limit）或其他錯誤，原樣拋出
 */
export async function callGeminiChat(
  systemPrompt: string,
  history:      ChatMessage[],
  userMessage:  string,
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY 未設定。請在 .env.local 中加入 GEMINI_API_KEY=<你的金鑰>。");
  }
  const model = genAI.getGenerativeModel({
    model:             GEMINI_MODEL,
    systemInstruction: systemPrompt,
  });

  const formattedHistory = history.map((msg) => ({
    role:  msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  const chat   = model.startChat({ history: formattedHistory });
  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}

/**
 * 判斷錯誤是否為 Gemini rate limit（429 / quota 字串）。
 */
export function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("429") || msg.includes("quota");
}
