/**
 * 環境變數驗證 — 啟動時確保所有必要設定已存在
 *
 * 用法：在 instrumentation.ts 或 API route 的頂層呼叫 validateEnv()。
 * 若有任何必填變數缺失，立即拋錯，避免執行到一半才失敗。
 */

interface EnvConfig {
  /** Supabase 專案 URL */
  NEXT_PUBLIC_SUPABASE_URL: string;
  /** Supabase anon key（客戶端用）*/
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  /** Supabase service role key（伺服器端用）*/
  SUPABASE_SERVICE_ROLE_KEY: string;
  /** Gemini API key */
  GEMINI_API_KEY: string;
}

type EnvKey = keyof EnvConfig;

/** 必填變數清單 */
const REQUIRED_VARS: EnvKey[] = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
];

/** 選填變數（缺少只警告，不拋錯）*/
const OPTIONAL_VARS: string[] = [];

let validated = false;

/**
 * 驗證環境變數。
 * - 伺服器端：首次呼叫時執行，後續呼叫直接跳過（已快取結果）。
 * - 客戶端：只能驗證 NEXT_PUBLIC_* 變數；服務端變數在瀏覽器中永遠是 undefined。
 */
export function validateEnv(): void {
  if (validated) return;

  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    const val = process.env[key];
    if (!val || val.trim() === "") {
      // 客戶端環境下，伺服器端私有變數預期是 undefined，不報錯
      if (typeof window !== "undefined" && !key.startsWith("NEXT_PUBLIC_")) continue;
      missing.push(key);
    }
  }

  for (const key of OPTIONAL_VARS) {
    if (!process.env[key]) {
      console.warn(`[env] 選填環境變數未設定：${key}`);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[env] 缺少必填環境變數：\n  ${missing.join("\n  ")}\n` +
      `請確認 .env.local 已正確設定。`,
    );
  }

  validated = true;
}

/**
 * 安全取得環境變數。若取不到，拋出具體錯誤訊息。
 * 適合在 API routes 內確保取值不為 undefined。
 */
export function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val || val.trim() === "") {
    throw new Error(`[env] 必填環境變數 ${key} 未設定`);
  }
  return val;
}

/**
 * 判斷 Supabase 是否已設定（不拋錯，供條件判斷用）。
 */
export function isSupabaseEnvSet(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * 判斷 Gemini 是否已設定（不拋錯）。
 */
export function isGeminiEnvSet(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
