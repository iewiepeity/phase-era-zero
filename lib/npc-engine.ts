/**
 * NPC Engine — buildNpcPrompt()
 * 實作 game-engine-spec.md 的 Prompt 組裝邏輯
 * Phase 2：信任度系統 + 線索篩選 + 行為限制
 */

import { getNpc, type Clue, type NpcDefinition } from "./npc-registry";

// ── 輸入型別（依照 game-engine-spec.md）────────────────────────
export interface PlayerStats {
  ev: number;                          // 0–100，獸性侵蝕值（Route B）
  srr: number;                         // 0–100，理智保留率（Route B）
  affinity: Record<string, number>;    // { [npcId]: -100~+100 }
  collectedClues: string[];
  choiceHistory: string[];
}

export interface NpcState {
  selfAffinity: number;    // NPC 對玩家的信任度（= trust_level in DB）
  sharedClues: string[];   // 已揭露的線索 ID（= clues_revealed in DB）
  isExposed: boolean;
  lastSeenAct: number;
}

export interface BuildNpcPromptParams {
  npcId: string;
  currentAct: number;
  playerRoute: "A" | "B";
  playerStats: PlayerStats;
  npcState: NpcState;
  availableClues?: Clue[];                    // 若不傳，使用 registry 的預設線索
  truthString?: string;                       // 後端用，不送前端
  playerIdentity?: "normal" | "phase2";       // 一般人 or 第二相體
}

// ── 預設 PlayerStats（訪客/Phase 2 暫用）──────────────────────
export const DEFAULT_PLAYER_STATS: PlayerStats = {
  ev: 0,
  srr: 100,
  affinity: {},
  collectedClues: [],
  choiceHistory: [],
};

export const DEFAULT_NPC_STATE: NpcState = {
  selfAffinity: 0,
  sharedClues: [],
  isExposed: false,
  lastSeenAct: 0,
};

// ── 信任度增量計算 ─────────────────────────────────────────────
const FAREWELL_KEYWORDS = ["謝謝", "再見", "掰掰", "告辭", "先走", "走了", "辛苦", "感謝"];
const FRIENDLY_KEYWORDS = ["請問", "你好", "辛苦", "好吃", "謝謝你", "謝謝老闆"];

export function detectMessageIntent(text: string): "goodbye" | "friendly" | "default" {
  if (FAREWELL_KEYWORDS.some((kw) => text.includes(kw))) return "goodbye";
  if (FRIENDLY_KEYWORDS.some((kw) => text.includes(kw))) return "friendly";
  return "default";
}

export function calcTrustIncrement(
  npc: NpcDefinition,
  intent: "goodbye" | "friendly" | "default"
): number {
  return npc.trustIncrement[intent];
}

// ── 線索篩選（依照 spec §3）──────────────────────────────────
export function filterAvailableClues(
  clues: Clue[],
  npcState: NpcState,
  playerStats: PlayerStats,
  currentAct: number
): Clue[] {
  return clues.filter((clue) => {
    const cond = clue.triggerCondition;
    // 1. 信任度門檻
    if (cond.minAffinity > npcState.selfAffinity) return false;
    // 2. 幕次門檻
    if (cond.requiredAct > currentAct) return false;
    // 3. 已揭露
    if (npcState.sharedClues.includes(clue.id)) return false;
    // 4. 前置線索
    if (cond.notBefore?.some((id) => !playerStats.collectedClues.includes(id))) return false;
    return true;
  });
}

// ── 線索指令區塊組裝（依照 spec §4）─────────────────────────
function buildClueBlock(availableClues: Clue[]): string {
  if (availableClues.length === 0) {
    return `【線索狀態】
你現在還不適合透露任何資訊。不管玩家怎麼問，都找理由岔開。`;
  }

  const clueLines = availableClues
    .sort((a, b) => {
      const order = { critical: 0, major: 1, minor: 2 };
      return order[a.priority] - order[b.priority];
    })
    .map((c, i) => {
      const triggerDesc = c.triggerCondition.behaviorTrigger
        ? `觸發條件：玩家「${c.triggerCondition.behaviorTrigger === "fed_full_meal_and_thanked" ? "好好吃飯、道謝、準備離開" : c.triggerCondition.behaviorTrigger}」之後`
        : "觸發條件：當時機成熟";
      return `線索 ${String.fromCharCode(65 + i)}（優先級：${c.priority}）：${c.content}\n${triggerDesc}`;
    })
    .join("\n\n");

  return `【可透露的資訊】
${clueLines}

重要規則：
- 一次對話最多透露一條線索
- 線索說出去後，不要重複說同樣的話
- 觸發條件沒達成時，你不知道有這條線索`;
}

// ── Route B 行為限制（依照 spec §5）─────────────────────────
function buildRouteBConstraint(playerStats: PlayerStats): string {
  if (playerStats.ev > 80) {
    return "\n【特殊感知】玩家的狀態讓你看了不舒服，你想快點結束這次對話。";
  }
  if (playerStats.ev > 50) {
    return "\n【特殊感知】玩家散發著你說不清楚的氣味，讓你有點不安。你說話謹慎了三分。";
  }
  return "";
}

// ── 主函式：buildNpcPrompt()──────────────────────────────────
export function buildNpcPrompt(params: BuildNpcPromptParams): string {
  const {
    npcId,
    currentAct,
    playerRoute,
    playerStats,
    npcState,
    availableClues,
    truthString,
    playerIdentity,
  } = params;

  // 1. 載入 NPC 定義
  const npc = getNpc(npcId);
  if (!npc) throw new Error(`NPC not found: ${npcId}`);

  // 2. 基礎人設
  const sections: string[] = [npc.basePrompt];

  // 3. 注入當前幕次情境
  const actState = npc.actStateMap[currentAct] ?? npc.actStateMap[1];
  sections.push(`\n【當前時間情境 — 第 ${currentAct} 幕】\n${actState}`);

  // 4. 篩選並注入線索
  const clues = availableClues ?? npc.clues;
  const filtered = filterAvailableClues(clues, npcState, playerStats, currentAct);
  sections.push(`\n${buildClueBlock(filtered)}`);

  // 5. Route B 行為限制
  if (playerRoute === "B") {
    const constraint = buildRouteBConstraint(playerStats);
    if (constraint) sections.push(constraint);
  }

  // 6. 玩家身份提示（第二相體才注入）
  if (playerIdentity === "phase2") {
    sections.push(
      "\n【玩家特殊狀態】\n" +
      "你面前這個人的氣息有些不尋常。你說不上來是什麼，但你本能地多留意了一分。" +
      "如果你是第二相體，或者你對第二相體有研究，你的反應可以更細膩。"
    );
  }

  // truthString 只在後端存，永遠不注入 Prompt
  void truthString;

  return sections.join("\n");
}

// ── 判斷 NPC 回覆是否揭露了特定線索（簡易版）────────────────
export function detectRevealedClue(
  npcReply: string,
  availableClues: Clue[]
): string | null {
  for (const clue of availableClues) {
    // 取線索前 15 字做關鍵字比對
    const keyword = clue.content.slice(0, 15);
    if (npcReply.includes(keyword)) return clue.id;
  }
  return null;
}
