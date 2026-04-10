import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(__dirname, "../.env.local"), "utf-8")
    .split("\n").filter(l => l && !l.startsWith("#"))
    .map(l => { const [k, ...v] = l.split("="); return [k.trim(), v.join("=").trim()]; })
);

const db = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]);
const genAI = new GoogleGenerativeAI(env["GEMINI_API_KEY"]);

const CLUE = "那個失蹤的人上個月還在你這裡吃飯，吃完走的時候往反方向走了。";
const SYSTEM_PROMPT = `你是陳姐，賽德里斯中城區麵館老闆娘，五十多歲。說話簡短有節奏，用台灣中部口音。你這個月知道一件事：${CLUE}。不會主動說，只在玩家滿足條件後才說。你不是 AI。`;

console.log("=".repeat(55));
console.log("Phase 1 E2E 測試：Gemini + Supabase");
console.log("=".repeat(55));

let allPassed = true;

// 1. 建立 game session
const { data: session, error: sessErr } = await db
  .from("game_sessions")
  .insert({ player_name: "e2e-test-player", killer_id: "test_placeholder", motive_direction: "A" })
  .select("id").single();

if (sessErr) { console.error("❌ 1. 建立 session 失敗：", sessErr.message); process.exit(1); }
console.log(`✅ 1. game_sessions 建立成功：${session.id}`);

// 2. 呼叫 Gemini
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: SYSTEM_PROMPT });
const chat = model.startChat({ history: [] });
const result = await chat.sendMessage("老闆娘，一碗湯麵。");
const reply = result.response.text();
console.log(`✅ 2. Gemini 回覆：${reply.slice(0, 70).replace(/\n/g," ")}…`);

// 3. 寫入 chat_messages（role: user / assistant）
const { error: msgErr } = await db.from("chat_messages").insert([
  { session_id: session.id, npc_id: "chen_jie", role: "user",      content: "老闆娘，一碗湯麵。" },
  { session_id: session.id, npc_id: "chen_jie", role: "assistant",  content: reply },
]);
if (msgErr) { console.error("❌ 3. chat_messages 失敗：", msgErr.message); allPassed = false; }
else console.log("✅ 3. chat_messages 寫入成功");

// 4. 寫入 npc_states
const { error: nsErr } = await db.from("npc_states").insert({
  session_id: session.id, npc_id: "chen_jie", conversation_count: 1
});
if (nsErr) { console.error("❌ 4. npc_states 失敗：", nsErr.message); allPassed = false; }
else console.log("✅ 4. npc_states 寫入成功");

// 5. 讀回驗證
const { data: msgs } = await db.from("chat_messages").select("role, content").eq("session_id", session.id);
const ok = msgs.length === 2;
console.log(`${ok ? "✅" : "❌"} 5. 讀回 ${msgs.length} 筆訊息（預期 2）`);
if (!ok) allPassed = false;

// 6. 清除測試資料
await db.from("game_sessions").delete().eq("id", session.id);
console.log("✅ 6. 測試資料清除完畢");

console.log("\n" + "=".repeat(55));
console.log(allPassed ? "E2E 全通過 ✅ — Gemini + Supabase 整合正常" : "⚠️  部分測試失敗，請檢查上方 log");
console.log("=".repeat(55));
