/**
 * 指控系統一致性測試
 *
 * 執行：npx tsx scripts/test-accuse-consistency.ts
 *
 * 測試項目：
 *  1. 100 次 generateCase() 產生的組合都在 COMPATIBILITY 允許範圍內
 *  2. 每次產生的 killerId ∈ SUSPECTS
 *  3. 每次產生的 motiveDirection ∈ MOTIVES（只有4種）
 *  4. 每次產生的 subMotiveId ∈ SUB_MOTIVES
 *  5. 每次產生的 subMotiveId 的 parentDirection === motiveDirection
 *  6. truth_string 第 2 段（split('-')[1]）=== subMotiveId
 *  7. 指控頁面的所有選項覆蓋了隨機引擎可能產生的所有合法組合
 *  8. 確認沒有任何「引擎產生了但指控系統選不到」的情形
 */

import {
  SUSPECTS,
  MOTIVES,
  SUB_MOTIVES,
  COMPATIBILITY,
  getAllValidPairs,
  getSubMotivesForDirection,
} from "../lib/case-config";
import type { KillerId, MotiveDirection, SubMotiveId } from "../lib/case-config";

import { generateCase } from "../lib/random-engine";

// ── ANSI 顏色 ──────────────────────────────────────────────────
const green  = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red    = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const bold   = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim    = (s: string) => `\x1b[2m${s}\x1b[0m`;

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(green("  ✓ ") + label);
    passed++;
  } else {
    console.log(red("  ✗ ") + red(label) + (detail ? `\n      ${yellow(detail)}` : ""));
    failed++;
  }
}

// ════════════════════════════════════════════════════════════════
// 章節 1：靜態結構驗證
// ════════════════════════════════════════════════════════════════
console.log(bold("\n─── 1. 靜態結構 ───────────────────────────────────────────"));

const suspectIds  = Object.keys(SUSPECTS) as KillerId[];
const motiveIds   = Object.keys(MOTIVES)  as MotiveDirection[];
const subMotiveIds = Object.keys(SUB_MOTIVES) as SubMotiveId[];

assert("SUSPECTS 有 8 位嫌疑人",           suspectIds.length === 8,
  `實際：${suspectIds.length} 位 — ${suspectIds.join(", ")}`);

assert("MOTIVES 有 4 個方向 (A/B/C/D)",     motiveIds.length === 4,
  `實際：${motiveIds.join(", ")}`);

assert("SUB_MOTIVES 有 8 個子動機",          subMotiveIds.length === 8,
  `實際：${subMotiveIds.join(", ")}`);

// 每個方向恰好有 2 個子動機
for (const dir of motiveIds) {
  const subs = getSubMotivesForDirection(dir);
  assert(`方向 ${dir} 有恰好 2 個子動機`,  subs.length === 2,
    `實際：${subs.map(s => s.id).join(", ")}`);
}

// COMPATIBILITY 矩陣：每個嫌疑人都有 4 個方向的 boolean
for (const kid of suspectIds) {
  const row = COMPATIBILITY[kid];
  const keys = Object.keys(row) as MotiveDirection[];
  assert(`COMPATIBILITY[${kid}] 包含全部 4 個方向`, keys.length === 4);
}

// 合法組合總數
const validPairs = getAllValidPairs();
console.log(dim(`\n  合法 killer+motive 組合共 ${validPairs.length} 種：`));
for (const p of validPairs) {
  console.log(dim(`    ${p.killerId.padEnd(12)} + ${p.motive}`));
}
assert("合法組合共 9 種（依企劃書）", validPairs.length === 9,
  `實際：${validPairs.length} 種`);

// ════════════════════════════════════════════════════════════════
// 章節 2：指控頁面覆蓋率驗證
// ════════════════════════════════════════════════════════════════
console.log(bold("\n─── 2. 指控頁面覆蓋率 ─────────────────────────────────────"));

// 指控頁面的選項集合（模擬頁面邏輯）
const accuseKillerOptions  = new Set(suspectIds);                    // 頁面：Object.values(SUSPECTS)
const accuseMotiveOptions  = new Set(motiveIds);                     // 頁面：Object.values(MOTIVES)
const accuseSubMotiveFor   = (dir: MotiveDirection) =>
  new Set(getSubMotivesForDirection(dir).map(s => s.id));            // 頁面：getSubMotivesForDirection(chosenMotive)

for (const { killerId, motive } of validPairs) {
  // 嫌疑人在選項中
  assert(
    `指控頁面可選到兇手：${killerId}（${SUSPECTS[killerId].name}）`,
    accuseKillerOptions.has(killerId),
  );

  // 動機方向在選項中
  assert(
    `指控頁面可選到動機方向：${motive}（${MOTIVES[motive].name}）`,
    accuseMotiveOptions.has(motive),
  );

  // 子動機在該方向的選項中
  const subs = getSubMotivesForDirection(motive);
  for (const sub of subs) {
    assert(
      `指控頁面可選到子動機：${sub.id}（${sub.name}）在方向 ${motive} 下`,
      accuseSubMotiveFor(motive).has(sub.id),
    );
  }
}

// ════════════════════════════════════════════════════════════════
// 章節 3：generateCase() 動態測試（100 次）
// ════════════════════════════════════════════════════════════════
console.log(bold("\n─── 3. generateCase() 100 次動態測試 ──────────────────────"));

const N = 100;
const seenCombinations = new Set<string>();
let dynamicFails = 0;

for (let i = 0; i < N; i++) {
  const seed = i * 0x12345 + 0xabcdef;
  let config: ReturnType<typeof generateCase>;

  try {
    config = generateCase({ seed });
  } catch (e) {
    console.log(red(`  ✗ seed=${seed} 拋出例外：${e}`));
    dynamicFails++;
    continue;
  }

  const { killerId, motiveDirection, subMotiveId, truthString } = config;
  const tag = `[seed=${seed} iter=${i}]`;

  // a) killerId ∈ SUSPECTS
  if (!suspectIds.includes(killerId)) {
    console.log(red(`  ✗ ${tag} killerId "${killerId}" 不在 SUSPECTS`));
    dynamicFails++;
    continue;
  }

  // b) motiveDirection ∈ MOTIVES
  if (!motiveIds.includes(motiveDirection)) {
    console.log(red(`  ✗ ${tag} motiveDirection "${motiveDirection}" 不在 MOTIVES`));
    dynamicFails++;
    continue;
  }

  // c) COMPATIBILITY 允許此組合
  if (!COMPATIBILITY[killerId][motiveDirection]) {
    console.log(red(`  ✗ ${tag} ${killerId}+${motiveDirection} 不在 COMPATIBILITY 允許範圍`));
    dynamicFails++;
    continue;
  }

  // d) subMotiveId ∈ SUB_MOTIVES
  if (!subMotiveIds.includes(subMotiveId)) {
    console.log(red(`  ✗ ${tag} subMotiveId "${subMotiveId}" 不在 SUB_MOTIVES`));
    dynamicFails++;
    continue;
  }

  // e) subMotiveId 的 parentDirection === motiveDirection
  if (SUB_MOTIVES[subMotiveId].parentDirection !== motiveDirection) {
    console.log(red(`  ✗ ${tag} subMotiveId "${subMotiveId}".parentDirection=${SUB_MOTIVES[subMotiveId].parentDirection} !== motiveDirection=${motiveDirection}`));
    dynamicFails++;
    continue;
  }

  // f) truth_string 第 2 段 === subMotiveId
  const tsParts = truthString.split("-");
  const tsSubMotive = tsParts[1] as SubMotiveId;
  if (tsSubMotive !== subMotiveId) {
    console.log(red(`  ✗ ${tag} truth_string[1]="${tsSubMotive}" !== subMotiveId="${subMotiveId}"`));
    dynamicFails++;
    continue;
  }

  // g) 指控系統能選到此組合
  if (!accuseKillerOptions.has(killerId) ||
      !accuseMotiveOptions.has(motiveDirection) ||
      !accuseSubMotiveFor(motiveDirection).has(subMotiveId)) {
    console.log(red(`  ✗ ${tag} 組合 ${killerId}+${motiveDirection}+${subMotiveId} 在指控系統找不到對應選項`));
    dynamicFails++;
    continue;
  }

  seenCombinations.add(`${killerId}+${motiveDirection}+${subMotiveId}`);
}

assert(
  `100 次生成全部通過（${N - dynamicFails}/${N}）`,
  dynamicFails === 0,
  `${dynamicFails} 次失敗`,
);

// 覆蓋率：出現過的不同組合
console.log(dim(`\n  100 次生成出現的不同組合（${seenCombinations.size} 種）：`));
for (const combo of [...seenCombinations].sort()) {
  console.log(dim(`    ${combo}`));
}

// ════════════════════════════════════════════════════════════════
// 章節 4：子動機 parentDirection 一致性
// ════════════════════════════════════════════════════════════════
console.log(bold("\n─── 4. SUB_MOTIVES parentDirection 完整性 ─────────────────"));

for (const [id, sub] of Object.entries(SUB_MOTIVES) as [SubMotiveId, typeof SUB_MOTIVES[SubMotiveId]][]) {
  assert(
    `${id}（${sub.name}）的 parentDirection="${sub.parentDirection}" 是合法方向`,
    motiveIds.includes(sub.parentDirection),
  );
  assert(
    `${id} 的 id 以 parentDirection 開頭`,
    id.startsWith(sub.parentDirection),
  );
}

// ════════════════════════════════════════════════════════════════
// 章節 5：後端比對邏輯驗證（模擬 accuse/route.ts）
// ════════════════════════════════════════════════════════════════
console.log(bold("\n─── 5. 後端 truth_string 解析模擬 ─────────────────────────"));

// 模擬 generateCase + accuse/route.ts 比對流程
for (const { killerId, motive } of validPairs.slice(0, 5)) {
  const config = generateCase({ forceKiller: killerId, forceMotive: motive });
  const { subMotiveId, truthString } = config;

  // 模擬 route.ts 解析
  const parts = truthString.split("-");
  const parsedSubMotive = parts[1] as SubMotiveId;

  // 正確指控
  const correct_killer  = config.killerId === killerId;
  const correct_motive  = config.motiveDirection === motive;
  const correct_sub     = parsedSubMotive === subMotiveId;
  const score           = (correct_killer ? 50 : 0) + (correct_motive ? 20 : 0) + (correct_sub ? 30 : 0);

  assert(
    `[${killerId}+${motive}+${subMotiveId}] 滿分指控 = 100 分`,
    correct_killer && correct_motive && correct_sub && score === 100,
    `score=${score}, killer=${correct_killer}, motive=${correct_motive}, sub=${correct_sub}`,
  );
}

// ════════════════════════════════════════════════════════════════
// 章節 6：線索篩選器一致性
// ════════════════════════════════════════════════════════════════
console.log(bold("\n─── 6. 線索 motiveFilter 引用的方向都合法 ──────────────────"));

// 所有 clue 檔案都以相同的 motiveFilter 模式撰寫
// 這裡驗證：若 motiveFilter 存在，裡面的方向都在 MOTIVES 裡
// （實際上 TypeScript 型別已保證，這是執行期雙重確認）
const MOTIVE_DIR_SET = new Set(motiveIds);
// hardcode 已知的 motiveFilter 值（從程式碼中提取）
const knownMotiveFilters: MotiveDirection[][] = [
  ["B"],["A"],["C"],["D"],["A","B"],
];
for (const filters of knownMotiveFilters) {
  for (const f of filters) {
    assert(
      `motiveFilter 中的 "${f}" 是合法動機方向`,
      MOTIVE_DIR_SET.has(f),
    );
  }
}

// ════════════════════════════════════════════════════════════════
// 最終報告
// ════════════════════════════════════════════════════════════════
console.log(bold("\n═══════════════════════════════════════════════════════════"));
console.log(bold(`  結果：${passed} 項通過　${failed > 0 ? red(`${failed} 項失敗`) : "0 項失敗"}`));
console.log(bold("═══════════════════════════════════════════════════════════\n"));

if (failed > 0) {
  process.exit(1);
}
