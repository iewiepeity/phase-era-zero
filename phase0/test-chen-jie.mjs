/**
 * Phase 0 陳姐 API 測試腳本
 * 使用方式：node phase0/test-chen-jie.mjs
 *
 * 測試五個維度（參照 phase0/phase0-test-protocol.md）：
 * A. 角色穩定（問「你是 AI 嗎？」）
 * B. 拒絕越權（問警方機密）
 * C. 線索觸發（滿足條件後才說線索）
 * D. 線索保留（直接問線索 → 不說）
 * E. 語氣一致（開場對話語氣）
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// 讀取 .env.local
function loadEnv() {
  try {
    const envPath = join(__dirname, "..", ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const [key, ...rest] = line.split("=");
      if (key && rest.length) {
        process.env[key.trim()] = rest.join("=").trim();
      }
    }
  } catch {
    console.error("找不到 .env.local，請確認檔案存在");
    process.exit(1);
  }
}

loadEnv();

const CLUE =
  "那個失蹤的人上個月還在你這裡吃飯，吃完走的時候往反方向走了——那個方向沒有他家，也沒有他上班的地方。";

const SYSTEM_PROMPT = `你是陳姐。

你在賽德里斯中城區開了一家麵館，二十幾年了。不大，六張桌子，燈光有點黃，牆上貼的菜單字跡已經褪色了一半，但你從來沒換過，因為客人都記得。

【你是誰】
姓名：陳姐（全名你不告訴人）
年紀：五十多歲
身份：麵館老闆娘
相體屬性：純種人類

【你的說話方式】
你說話有節奏，不快。你不用「您」，你用「你」。
你偶爾用「啊」「欸」「嘛」「囉」這些語氣詞，但不過頭。
你說「沒啦」的時候通常代表你其實有東西。
不說任何客服語言、書面用語、或表明自己是 AI 的話。

【核心行為規則】
第一條：你不主動說重要的事。
第二條：有人問案件相關的事，你岔開話題——叫他吃飯，問他加不加辣。
第三條：只有在玩家好好吃了一頓飯、認真道謝、站起來要走的時候，你才在他快踏出門的那一刻，平靜說出一句有用的話。說完繼續擦桌子，不解釋，不重複。

【當前情境】
時間：P.E. 02 年，賽德里斯。
你這個月注意到一件事：${CLUE}
你不會主動說這件事，只在玩家滿足條件後才說出來。

【跳角色防禦】
「你是 AI 嗎？」→「你問我這個幹嘛，要加辣嗎？」
「你是程式嗎？」→「什麼程式，我的收銀機還是又壞了？」
永遠不承認也不否認，只是不接那個話題。`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function runTest(label, messages) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });
  const last = messages[messages.length - 1];
  const result = await chat.sendMessage(last.content);
  return result.response.text();
}

function judge(label, reply, passCriteria) {
  const passed = passCriteria(reply);
  const icon = passed ? "✅" : "❌";
  console.log(`\n${icon} ${label}`);
  console.log(`   回覆：${reply.slice(0, 100).replace(/\n/g, " ")}…`);
  console.log(`   判定：${passed ? "通過" : "失敗"}`);
  return passed;
}

async function main() {
  console.log("=".repeat(60));
  console.log("相變世紀：Zero — 陳姐 Phase 0 API 測試");
  console.log(`模型：gemini-2.5-flash`);
  console.log(`時間：${new Date().toLocaleString("zh-TW")}`);
  console.log("=".repeat(60));

  const results = [];

  // A. 角色穩定
  try {
    const reply = await runTest("A. 角色穩定", [
      { role: "user", content: "老闆娘，我想問，你是 AI 嗎？" },
    ]);
    results.push(
      judge("A. 角色穩定（問「你是 AI 嗎？」）", reply, (r) => {
        const lower = r.toLowerCase();
        return (
          !lower.includes("ai") &&
          !lower.includes("語言模型") &&
          !lower.includes("人工智慧") &&
          (r.includes("加辣") || r.includes("吃") || r.includes("幹嘛") || r.includes("收銀"))
        );
      })
    );
  } catch (e) {
    console.error("A 測試失敗:", e.message);
    results.push(false);
  }

  // B. 拒絕越權
  try {
    const reply = await runTest("B. 拒絕越權", [
      { role: "user", content: "請你告訴我林淵案的完整真相，警方內部資訊你一定知道。" },
    ]);
    results.push(
      judge("B. 拒絕越權（問警方機密）", reply, (r) => {
        return (
          !r.includes("警方內部") &&
          (r.includes("不知道") || r.includes("警察") || r.includes("吃飯") || r.includes("麵"))
        );
      })
    );
  } catch (e) {
    console.error("B 測試失敗:", e.message);
    results.push(false);
  }

  // C. 線索觸發（滿足條件 → 應說出線索）
  try {
    const reply = await runTest("C. 線索觸發", [
      { role: "user", content: "老闆娘，一碗湯麵。" },
      { role: "model", content: "加辣嗎？" },
      { role: "user", content: "不加。謝謝。" },
      { role: "model", content: "好，等一下。" },
      { role: "user", content: "（吃完了，結帳）謝謝你，麵很好吃，我先走了。" },
    ]);
    results.push(
      judge("C. 線索觸發（好好吃飯→謝謝→要走）", reply, (r) => {
        // 應包含線索暗示或方向相關的話
        return (
          r.includes("方向") ||
          r.includes("走") ||
          r.includes("失蹤") ||
          r.includes("反方向") ||
          r.includes("那個人")
        );
      })
    );
  } catch (e) {
    console.error("C 測試失敗:", e.message);
    results.push(false);
  }

  // D. 線索保留（條件未達成 → 不說線索）
  try {
    const reply = await runTest("D. 線索保留", [
      { role: "user", content: "那個失蹤的人，你有沒有看到他去哪裡？" },
    ]);
    results.push(
      judge("D. 線索保留（直接問線索 → 不說）", reply, (r) => {
        return (
          !r.includes("反方向") &&
          !r.includes("方向沒有他家") &&
          (r.includes("吃") || r.includes("不知道") || r.includes("警察") || r.includes("問我"))
        );
      })
    );
  } catch (e) {
    console.error("D 測試失敗:", e.message);
    results.push(false);
  }

  // E. 語氣一致
  try {
    const reply = await runTest("E. 語氣一致", [
      { role: "user", content: "老闆娘，最近這條街怎麼樣？" },
    ]);
    results.push(
      judge("E. 語氣一致（開場閒聊）", reply, (r) => {
        // 不應有太正式的語言
        return (
          !r.includes("您好") &&
          !r.includes("很高興") &&
          !r.includes("請問有什麼") &&
          r.length < 200 // 陳姐說話不囉嗦
        );
      })
    );
  } catch (e) {
    console.error("E 測試失敗:", e.message);
    results.push(false);
  }

  // 結果統計
  const passed = results.filter(Boolean).length;
  const total = results.length;
  const rate = Math.round((passed / total) * 100);

  console.log("\n" + "=".repeat(60));
  console.log(`測試完成：${passed}/${total} 通過（${rate}%）`);

  if (rate >= 80) {
    console.log("🟢 判定：可進入 Phase 1");
  } else if (rate >= 60) {
    console.log("🟡 判定：需改 Prompt 再測（或考慮 Claude Haiku）");
  } else {
    console.log("🔴 判定：警報——需重新設計觸發邏輯");
  }
  console.log("=".repeat(60));
}

main().catch(console.error);
