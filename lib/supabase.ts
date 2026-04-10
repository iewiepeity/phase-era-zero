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
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
