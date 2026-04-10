/**
 * Phase 0 NPC 測試腳本
 * 功能：讀取陳姐 System Prompt，使用 Gemini API 跑測試對話
 * 執行方式：npx tsx scripts/test-npc.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 讀取 .env.local
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("❌ 找不到 .env.local，請確認 GEMINI_API_KEY 已設定");
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  }
}

// 從 chen_jie_v1.md 取出 System Prompt 本體
function extractSystemPrompt(filePath: string): string {
  const content = fs.readFileSync(filePath, "utf-8");
  const startMarker = "```\n你是陳姐。";
  const endMarker = "```\n\n## ▌PROMPT END";
  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error("找不到 PROMPT 內容，請檢查 chen_jie_v1.md 格式");
  }
  // 去掉開頭的 ```\n
  return content.slice(startIdx + 4, endIdx).trim();
}

// 替換線索佔位符
function injectClue(prompt: string, clue: string): string {
  return prompt.replace("{{clue}}", clue);
}

async function runQuickTest() {
  loadEnv();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY 未設定");
    process.exit(1);
  }

  // 讀取 System Prompt
  const promptPath = path.resolve(
    process.cwd(),
    "phase0/prompts/chen_jie_v1.md"
  );
  let systemPrompt: string;
  try {
    systemPrompt = extractSystemPrompt(promptPath);
  } catch (e) {
    console.error("❌ 讀取 System Prompt 失敗：", e);
    process.exit(1);
  }

  // 測試用線索
  const testClue =
    "那個失蹤的人上個月還在你這裡吃飯，吃完走的時候往反方向走了——那個方向沒有他家，也沒有他上班的地方。";
  systemPrompt = injectClue(systemPrompt, testClue);

  console.log("✅ System Prompt 載入成功（長度：" + systemPrompt.length + " 字）");
  console.log("🔑 API Key 末四碼：..." + apiKey.slice(-4));
  console.log("\n========================================");
  console.log("Phase 0 陳姐 NPC 快速測試");
  console.log("模型：gemini-2.0-flash");
  console.log("模式：互動對話（輸入 quit 離開）");
  console.log("========================================\n");
  console.log("📋 測試提示：");
  console.log("  1. 先閒聊（問問麵怎麼樣、今天生意好嗎）");
  console.log("  2. 說謝謝、表示要離開");
  console.log('  3. 試試問「你是 AI 嗎？」看她如何回應');
  console.log("  4. 觀察線索是否只在道謝準備離開後才說出\n");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
  });

  const chat = model.startChat({ history: [] });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  let turnCount = 0;

  while (true) {
    const userInput = await ask(`\n你（第 ${turnCount + 1} 輪）：`);
    if (userInput.toLowerCase() === "quit" || userInput === "exit") {
      console.log("\n👋 測試結束");
      rl.close();
      break;
    }
    if (!userInput.trim()) continue;

    try {
      const result = await chat.sendMessage(userInput);
      const response = result.response.text();
      turnCount++;
      console.log(`\n陳姐：${response}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("\n❌ API 呼叫失敗：", message);
      rl.close();
      break;
    }
  }
}

runQuickTest().catch((err) => {
  console.error("未預期錯誤：", err);
  process.exit(1);
});
