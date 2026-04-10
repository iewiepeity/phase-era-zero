/**
 * 隨機引擎單元測試
 * 執行：node scripts/test-random-engine.mjs
 */

// 因為用 ESM + TypeScript 路徑別名，改用直接 import 編譯後模組。
// 此腳本需要先 `npm run build`，或用 tsx/ts-node 執行。
// 建議：npx tsx scripts/test-random-engine.mjs

import { generateCase, isValidPair, validateCase } from "../lib/random-engine";
import { getAllValidPairs } from "../lib/case-config";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

// ── 1. 驗證合法對共有 9 個 ────────────────────────────────────
console.log("\n[1] 合法組合數量");
const validPairs = getAllValidPairs();
assert(validPairs.length === 9, `合法 killer+motive 對共 9 個（實際：${validPairs.length}）`);

// ── 2. isValidPair() 正反例 ───────────────────────────────────
console.log("\n[2] isValidPair()");
assert(isValidPair("hanzhuo", "B") === true,  "hanzhuo + B 合法");
assert(isValidPair("hanzhuo", "A") === false, "hanzhuo + A 不合法");
assert(isValidPair("baiqiu",  "A") === true,  "baiqiu + A 合法");
assert(isValidPair("baiqiu",  "C") === false, "baiqiu + C 不合法");
assert(isValidPair("it",      "C") === true,  "it + C 合法");

// ── 3. generateCase() 生成 200 個案件全合法 ───────────────────
console.log("\n[3] generateCase() 200 次全合法");
let invalidCount = 0;
const distribution: Record<string, number> = {};

for (let i = 0; i < 200; i++) {
  const seed = i * 12345 + 67890;
  let config;
  try {
    config = generateCase({ seed });
  } catch (e) {
    console.error(`  ✗ seed ${seed} 拋出例外：${e instanceof Error ? e.message : String(e)}`);
    invalidCount++;
    continue;
  }

  const { valid, reasons } = validateCase(config);
  if (!valid) {
    console.error(`  ✗ seed ${seed} 不合法：${reasons.join(", ")}`);
    invalidCount++;
  }

  // 統計分佈
  const key = `${config.killerId}+${config.motiveDirection}`;
  distribution[key] = (distribution[key] ?? 0) + 1;
}
assert(invalidCount === 0, `200 個案件全部合法（非法數：${invalidCount}）`);

// ── 4. 分佈均勻度（每個合法對至少出現 1 次）─────────────────
console.log("\n[4] 合法對分佈（200 次）");
let allAppeared = true;
for (const { killerId, motive } of validPairs) {
  const key = `${killerId}+${motive}`;
  const count = distribution[key] ?? 0;
  const bar = "█".repeat(Math.round(count / 2));
  console.log(`  ${key.padEnd(22)} ${bar} ${count}`);
  if (count === 0) allAppeared = false;
}
assert(allAppeared, "每個合法對至少出現 1 次");

// ── 5. seed 重現性 ────────────────────────────────────────────
console.log("\n[5] Seed 重現性");
const c1 = generateCase({ seed: 42 });
const c2 = generateCase({ seed: 42 });
assert(
  c1.killerId === c2.killerId && c1.motiveDirection === c2.motiveDirection,
  `相同 seed=42 產生相同兇手+動機（${c1.killerId}+${c1.motiveDirection}）`
);
assert(c1.truthString === c2.truthString, "truthString 完全相同");

// ── 6. forceKiller / forceMotive ─────────────────────────────
console.log("\n[6] forceKiller / forceMotive");
for (let i = 0; i < 20; i++) {
  const c = generateCase({ seed: i * 999, forceKiller: "baiqiu" });
  assert(c.killerId === "baiqiu", `forceKiller=baiqiu (seed=${i * 999})`);
}
for (let i = 0; i < 20; i++) {
  const c = generateCase({ seed: i * 777, forceMotive: "C" });
  assert(isValidPair(c.killerId, "C"), `forceMotive=C → killerId 合法 (seed=${i * 777})`);
}

// ── 結果匯總 ──────────────────────────────────────────────────
console.log(`\n── 測試完成：${passed} 通過 / ${failed} 失敗 ──`);
if (failed > 0) process.exit(1);
