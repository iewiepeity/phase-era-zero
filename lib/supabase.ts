import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** 瀏覽器端 Client（Client Components 使用） */
export function createBrowserSupabase() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/** 伺服器端 Client（API Routes / Server Components 使用） */
export function createServerSupabase() {
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnonKey;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

/** 快速檢查 Supabase 環境變數是否已設定 */
export function isSupabaseConfigured(): boolean {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const ok   = Boolean(url && key);
  if (!ok && process.env.NODE_ENV !== "production") {
    console.warn(
      "[supabase] isSupabaseConfigured=false  " +
      `URL=${url ? "SET" : "MISSING"}  KEY=${key ? "SET" : "MISSING"}`,
    );
  }
  return ok;
}

/**
 * 若 Supabase 未設定則拋出例外（用於必須有 DB 的 API）。
 * 比靜默 return null 更容易發現設定問題。
 */
export function requireSupabase(context: string): void {
  if (!isSupabaseConfigured()) {
    throw new Error(
      `[supabase] ${context}: Supabase 未設定，請確認 .env.local 中有 ` +
      `NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。`,
    );
  }
}
