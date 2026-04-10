import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(__dirname, "../.env.local"), "utf-8")
    .split("\n").filter(l => l && !l.startsWith("#"))
    .map(l => { const [k, ...v] = l.split("="); return [k.trim(), v.join("=").trim()]; })
);
const db = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]);

// 建一個 session 再測試各種 role 值
const { data: s } = await db.from("game_sessions")
  .insert({ player_name: "probe", killer_id: "p", motive_direction: "A" })
  .select("id").single();

for (const role of ["user", "npc", "assistant", "model", "system", "ai", "player"]) {
  const { error } = await db.from("chat_messages").insert(
    { session_id: s.id, npc_id: "chen_jie", role, content: "probe" }
  );
  console.log(`role="${role}": ${error ? "❌ " + error.message.slice(0,60) : "✅ OK"}`);
}

await db.from("game_sessions").delete().eq("id", s.id);
