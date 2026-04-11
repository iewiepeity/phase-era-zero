/**
 * NPC Engine — buildNpcPrompt()
 * 實作 game-engine-spec.md 的 Prompt 組裝邏輯
 * Phase 2：信任度系統 + 線索篩選 + 行為限制
 */

import { getNpc, type Clue, type NpcDefinition } from "./npc-registry";
import { getNpcRelationships }                   from "./content/npc-relationships";
import { getTriggeredPrompts, type PlayerContext } from "./content/dialogue-triggers";
import { getScene }                               from "./scene-config";

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
  /** 當前場景 ID（讓 NPC 知道自己在哪裡）*/
  currentSceneId?: string;
  /** 過去對話的簡要記憶（供 System Prompt 注入）*/
  conversationMemory?: string;
  /** 玩家遊戲狀態（用於觸發條件判斷）*/
  playerContext?: PlayerContext;
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

// ── 場景情境區塊 ──────────────────────────────────────────────

function buildSceneContext(npcId: string, sceneId: string): string {
  const scene = getScene(sceneId);
  const npc   = getNpc(npcId);
  if (!scene) return "";

  // 如果這個 NPC 的 primary scene 就是當前場景，不需要特別說明
  const isHomeScene = npc?.sceneId === sceneId;
  if (isHomeScene) return "";

  return `\n【當前位置】\n你現在在「${scene.name}」（${scene.district}）。這不是你平常待的地方，但你現在在這裡。你可以根據這個地點的性質來調整你說話的方式和你願意說的事。`;
}

// ── NPC 關係知識注入 ──────────────────────────────────────────

function buildRelationshipContext(npcId: string): string {
  const relationships = getNpcRelationships(npcId);
  if (relationships.length === 0) return "";

  const lines = relationships
    .map((r) => r.description)
    .join("\n\n");

  return `\n【你認識的人】\n以下是你對這個城市裡一些人的了解。當對方問起這些人時，用這個作為基礎，但說得自然，不要像在背稿：\n\n${lines}`;
}

// ── 對話記憶注入 ──────────────────────────────────────────────

/**
 * 從 DB 載入的對話記錄建立記憶摘要，注入 System Prompt。
 * 讓 NPC 記得之前說過的話，避免前後矛盾。
 */
export function buildConversationMemory(
  historyMessages: Array<{ role: string; content: string }>,
  sceneName?: string,
): string {
  if (!historyMessages.length) return "";

  const filtered = historyMessages.filter(
    (m) => m.role === "user" || m.role === "assistant"
  );
  if (!filtered.length) return "";

  const FULL_KEEP = 8;    // 保留最近 N 輪完整（一輪 = user + assistant）
  const fullPairs: string[] = [];
  const summaryLines: string[] = [];

  // 從最新往舊整理輪次
  const pairs: Array<{ user: string; assistant: string }> = [];
  for (let i = 0; i < filtered.length - 1; i++) {
    if (filtered[i].role === "user" && filtered[i + 1].role === "assistant") {
      pairs.push({ user: filtered[i].content, assistant: filtered[i + 1].content });
      i++;
    }
  }

  const recentPairs = pairs.slice(-FULL_KEEP);
  const olderPairs  = pairs.slice(0, Math.max(0, pairs.length - FULL_KEEP));

  // 舊的對話做成摘要（只取關鍵內容）
  if (olderPairs.length > 0) {
    summaryLines.push(`（之前共有 ${olderPairs.length} 輪對話，你說過的要點包括：`);
    olderPairs.forEach((p, i) => {
      const shortReply = p.assistant.length > 80
        ? p.assistant.slice(0, 80) + "……"
        : p.assistant;
      summaryLines.push(`  第${i + 1}輪回應摘要：${shortReply}`);
    });
    summaryLines.push(")");
  }

  // 近期對話完整保留
  recentPairs.forEach((p) => {
    fullPairs.push(`對方：${p.user}`);
    fullPairs.push(`你：${p.assistant}`);
  });

  const sceneNote = sceneName ? `在${sceneName}` : "";
  const header = `【過去的對話記憶】\n你和這個人${sceneNote}已經聊過了。以下是你們說過的話，保持前後一致，不要說出與此矛盾的內容：`;

  const body = [
    ...summaryLines,
    ...(summaryLines.length && fullPairs.length ? ["—— 近期對話 ——"] : []),
    ...fullPairs,
  ].join("\n");

  return `\n${header}\n${body}`;
}

// ── 觸發條件區塊 ──────────────────────────────────────────────

function buildTriggerSection(npcId: string, ctx?: PlayerContext): string {
  if (!ctx) return "";

  const triggered = getTriggeredPrompts(npcId, ctx);
  if (triggered.length === 0) return "";

  // 最多注入 2 個觸發器，避免 prompt 過長
  return "\n" + triggered.slice(0, 2).join("\n\n");
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
    currentSceneId,
    conversationMemory,
    playerContext,
  } = params;

  // 1. 載入 NPC 定義
  const npc = getNpc(npcId);
  if (!npc) throw new Error(`NPC not found: ${npcId}`);

  // 2. 基礎人設
  const sections: string[] = [npc.basePrompt];

  // 3. NPC 關係知識（讓 NPC 知道他認識的人）
  const relContext = buildRelationshipContext(npcId);
  if (relContext) sections.push(relContext);

  // 4. 注入當前幕次情境
  const actState = npc.actStateMap[currentAct] ?? npc.actStateMap[1];
  sections.push(`\n【當前時間情境 — 第 ${currentAct} 幕】\n${actState}`);

  // 5. 當前場景（若非 NPC 主場景才注入）
  if (currentSceneId) {
    const sceneCtx = buildSceneContext(npcId, currentSceneId);
    if (sceneCtx) sections.push(sceneCtx);
  }

  // 6. 對話記憶注入
  if (conversationMemory) sections.push(conversationMemory);

  // 7. 觸發條件（基於玩家當前遊戲狀態）
  const triggerSection = buildTriggerSection(npcId, playerContext);
  if (triggerSection) sections.push(triggerSection);

  // 8. 篩選並注入線索
  const clues    = availableClues ?? npc.clues;
  const filtered = filterAvailableClues(clues, npcState, playerStats, currentAct);
  sections.push(`\n${buildClueBlock(filtered)}`);

  // 9. Route B 行為限制
  if (playerRoute === "B") {
    const constraint = buildRouteBConstraint(playerStats);
    if (constraint) sections.push(constraint);
  }

  // 10. 玩家身份提示（第二相體才注入）
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
