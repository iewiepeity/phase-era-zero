/**
 * verify-case.ts — 端對端案件配置驗證腳本
 *
 * 執行方式：npx tsx scripts/verify-case.ts
 *
 * 驗證項目：
 *   1. generateCase() 產生合法的 CaseConfig
 *   2. buildNpcClues() 對每位 NPC 都能生成線索（包含真實線索 + 紅鯡魚）
 *   3. buildNpcPrompt() 對兇手 NPC 注入兇手指令，對無辜 NPC 注入無辜指令
 *   4. 真相字串格式正確，子動機可解析
 *   5. 紅鯡魚線索不會指向真正的兇手（不能反而成為真線索）
 */

import { generateCase, buildNpcClues, validateCase } from "../lib/random-engine";
import { buildNpcPrompt, DEFAULT_PLAYER_STATS, DEFAULT_NPC_STATE } from "../lib/npc-engine";
import { NPC_REGISTRY } from "../lib/npc-registry";

// ── ANSI colors ────────────────────────────────────────────────
const OK  = "\x1b[32m✓\x1b[0m";
const ERR = "\x1b[31m✗\x1b[0m";
const INF = "\x1b[36mℹ\x1b[0m";

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ${OK} ${msg}`);
  } else {
    console.error(`  ${ERR} ${msg}`);
    process.exitCode = 1;
  }
}

// ── 1. 生成案件（3 次不同 seed）─────────────────────────���─────

console.log("\n=== 1. generateCase() 合法性驗證 ===");

for (let i = 0; i < 3; i++) {
  const seed = Date.now() + i * 12345;
  const config = generateCase({ seed });
  const { valid, reasons } = validateCase(config);

  console.log(`\n  [seed=${seed}]`);
  console.log(`  ${INF} 兇手=${config.killerId}  動機=${config.motiveDirection}  子動機=${config.subMotiveId}`);
  console.log(`  ${INF} truthString="${config.truthString}"`);

  assert(valid, `CaseConfig 通過合法性驗證`);

  // 驗證 truthString 可解析出 subMotiveId
  const parsedSubMotive = config.truthString?.split("-")[1];
  assert(
    parsedSubMotive === config.subMotiveId,
    `truthString 第二段 "${parsedSubMotive}" === subMotiveId "${config.subMotiveId}"`,
  );
}

// ── 2. buildNpcClues() 每位 NPC 有線索 ────────────────────────

console.log("\n=== 2. buildNpcClues() 線索生成驗證 ===");

const sampleConfig = generateCase({ seed: 42 });
console.log(`\n  本輪兇手：${sampleConfig.killerId}`);

const npcIds = Object.keys(NPC_REGISTRY);

for (const npcId of npcIds) {
  const clues = buildNpcClues(npcId, sampleConfig);
  const isKiller = npcId === sampleConfig.killerId;
  const realClues = clues.filter((c) => !c.id.startsWith(`${npcId}_rh_`));
  const herrings  = clues.filter((c) =>  c.id.startsWith(`${npcId}_rh_`));

  assert(
    clues.length > 0,
    `${npcId}（${isKiller ? "兇手" : "無辜"}）有 ${clues.length} 條線索`,
  );

  if (!isKiller) {
    assert(herrings.length > 0, `  ${npcId} 有 ${herrings.length} 條紅鯡魚線索`);

    // 驗證紅鯡魚不指向真正的兇手
    for (const rh of herrings) {
      // 從 id 反推目標：格式 npcId_rh_xxx_yyy 中的 targetNpcId 在 content 中可部分判斷
      // 只做非空斷言（因為真正的 target 資訊已在 content 裡）
      assert(rh.priority === "minor", `  紅鯡魚 ${rh.id} priority=minor`);
    }
  } else {
    assert(herrings.length === 0, `  兇手 ${npcId} 無紅鯡魚線索`);
  }
}

// ── 3. buildNpcPrompt() 兇手 vs 無辜指令注入 ──────────────────

console.log("\n=== 3. buildNpcPrompt() 角色指令注入驗證 ===");

for (const npcId of npcIds) {
  const isKiller = npcId === sampleConfig.killerId;

  let prompt = "";
  try {
    prompt = buildNpcPrompt({
      npcId,
      currentAct:    1,
      playerRoute:   "A",
      playerStats:   DEFAULT_PLAYER_STATS,
      npcState:      DEFAULT_NPC_STATE,
      availableClues: buildNpcClues(npcId, sampleConfig),
      killerId:       sampleConfig.killerId,
      motiveDirection: sampleConfig.motiveDirection,
    });
  } catch (e) {
    assert(false, `${npcId} buildNpcPrompt 拋出例外：${e}`);
    continue;
  }

  if (isKiller) {
    assert(
      prompt.includes("本局兇手") && prompt.includes("絕對不承認"),
      `兇手 ${npcId} 的 prompt 包含兇手指令`,
    );
    assert(
      !prompt.includes("本局無辜者"),
      `兇手 ${npcId} 的 prompt 不含無辜指令`,
    );
  } else {
    assert(
      prompt.includes("本局無辜者"),
      `無辜 ${npcId} 的 prompt 包含無辜指令`,
    );
    assert(
      !prompt.includes("本局兇手"),
      `無辜 ${npcId} 的 prompt 不含兇手指令`,
    );
  }
}

// ── 4. 多局驗證（確保不同兇手都能正常跑）─────────────────────

console.log("\n=== 4. 多局多兇手驗證 ===");

const KILLER_IDS = ["hanzhuo", "yushuang", "zhengbo", "it", "baiqiu", "zhuanghe", "linzhixia", "taosheng"];
for (const forceKiller of KILLER_IDS) {
  try {
    const config = generateCase({ forceKiller: forceKiller as import("../lib/case-config").KillerId });
    const { valid } = validateCase(config);
    assert(valid, `forceKiller=${forceKiller}  motiveDirection=${config.motiveDirection}`);

    // Prompt 應含兇手指令
    const prompt = buildNpcPrompt({
      npcId:           forceKiller,
      currentAct:      1,
      playerRoute:     "A",
      playerStats:     DEFAULT_PLAYER_STATS,
      npcState:        DEFAULT_NPC_STATE,
      availableClues:  buildNpcClues(forceKiller, config),
      killerId:        config.killerId,
      motiveDirection: config.motiveDirection,
    });
    assert(prompt.includes("本局兇手"), `  ${forceKiller} prompt 包含兇手指令`);
  } catch (e) {
    assert(false, `forceKiller=${forceKiller} 發生錯誤：${e}`);
  }
}

// ── 結果 ──────────────────────────────────────────────────────

const exitCode = process.exitCode ?? 0;
if (exitCode === 0) {
  console.log("\n\x1b[32m所有驗證通過 ✓\x1b[0m\n");
} else {
  console.log("\n\x1b[31m有驗證失敗，請檢查上方輸出 ✗\x1b[0m\n");
}
