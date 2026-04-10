import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(join(__dirname, "../.env.local"), "utf-8");
const env = Object.fromEntries(
  envContent.split("\n").filter(l => l && !l.startsWith("#"))
    .map(l => { const [k, ...v] = l.split("="); return [k.trim(), v.join("=").trim()]; })
);

const url = env["NEXT_PUBLIC_SUPABASE_URL"];
const key = env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

// 清掉剛才的測試資料
async function cleanup() {
  const r = await fetch(`${url}/rest/v1/game_sessions?killer_id=eq.placeholder`, {
    method: "DELETE",
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "return=minimal" },
  });
  console.log(`清除測試資料：${r.status}`);
}

// 探測 chat_messages 完整欄位
async function probeChatMessages() {
  const fakeSessionId = "d3307948-70a5-4428-b868-d444fae3b207"; // 已被清除，應產生 FK 錯誤
  // 先建一個 session
  const sessionRes = await fetch(`${url}/rest/v1/game_sessions`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ killer_id: "probe", motive_direction: "A" }),
  });
  const [session] = await sessionRes.json();
  console.log("\n建立測試 session:", session.id);

  // 插入 chat_message
  const msgRes = await fetch(`${url}/rest/v1/chat_messages`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ session_id: session.id, npc_id: "chen_jie", role: "user", content: "probe" }),
  });
  const [msg] = await msgRes.json();
  console.log("chat_messages columns:", Object.keys(msg).join(", "));
  console.log("chat_messages sample:", JSON.stringify(msg));

  // npc_states
  const nsRes = await fetch(`${url}/rest/v1/npc_states`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ session_id: session.id, npc_id: "chen_jie" }),
  });
  const [ns] = await nsRes.json();
  console.log("\nnpc_states columns:", Object.keys(ns).join(", "));
  console.log("npc_states sample:", JSON.stringify(ns));

  // 清除
  await fetch(`${url}/rest/v1/game_sessions?killer_id=eq.probe`, {
    method: "DELETE",
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "return=minimal" },
  });
  console.log("\n✅ 測試資料已清除");
}

await cleanup();
await probeChatMessages();
