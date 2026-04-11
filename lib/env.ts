/**
 * 環境變數驗證 — 啟動時檢查必要設定
 *
 * 在 Server Components / API Routes 中 import 此模組，
 * 缺少必要變數時會在 console 印出清楚的錯誤訊息。
 */

const REQUIRED_VARS = [
  "GEMINI_API_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

type RequiredVar = typeof REQUIRED_VARS[number];

let validated = false;

/**
 * 驗證所有必要環境變數。
 * 只在第一次呼叫時實際執行（之後快取結果）。
 */
export function validateEnv(): void {
  if (validated) return;
  validated = true;

  const missing: RequiredVar[] = [];

  for (const key of REQUIRED_VARS) {
    const value = process.env[key];
    if (!value || value.trim() === "") {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error("╔══════════════════════════════════════════════════╗");
    console.error("║  [env] 缺少必要的環境變數，部分功能將無法運作      ║");
    console.error("╠══════════════════════════════════════════════════╣");
    for (const key of missing) {
      console.error(`║  ✗  ${key.padEnd(45)}║`);
    }
    console.error("╠══════════════════════════════════════════════════╣");
    console.error("║  請在 .env.local 中設定上述變數後重新啟動伺服器   ║");
    console.error("╚══════════════════════════════════════════════════╝");
  }
}

/**
 * 取得環境變數，若不存在則拋出錯誤（用於必須有值的場合）。
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(`[env] 缺少必要的環境變數：${key}`);
  }
  return value;
}

// 模組載入時自動執行驗證（server-side only）
if (typeof window === "undefined") {
  validateEnv();
}
