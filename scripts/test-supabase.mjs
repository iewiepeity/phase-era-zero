import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// 讀 .env.local
const envContent = readFileSync(join(__dirname, "../.env.local"), "utf-8");
const env = Object.fromEntries(
  envContent.split("\n")
    .filter(l => l && !l.startsWith("#"))
    .map(l => { const [k, ...v] = l.split("="); return [k.trim(), v.join("=").trim()]; })
);

const url = env["NEXT_PUBLIC_SUPABASE_URL"];
const key = env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

console.log("URL:", url);
console.log("Key 前20碼:", key?.slice(0, 20) + "…");

const db = createClient(url, key);

const { data, error } = await db.from("profiles").select("count").limit(1);

if (error?.code === "42P01") {
  console.log("\n✅ 連線成功（profiles 表尚未建立，需執行 migration）");
} else if (error) {
  console.error("\n❌ 連線錯誤：", error.message, error.code);
} else {
  console.log("\n✅ 連線成功，profiles 表已存在");
  console.log("資料：", data);
}
