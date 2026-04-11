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
  /** 難度設定（影響 NPC 主動度與閃避行為）*/
  difficulty?: "easy" | "normal" | "hard";
  /** 當前場景 ID（讓 NPC 知道自己在哪裡）*/
  currentSceneId?: string;
  /** 過去對話的簡要記憶（供 System Prompt 注入）*/
  conversationMemory?: string;
  /** 玩家遊戲狀態（用於觸發條件判斷）*/
  playerContext?: PlayerContext;
  /** 本局真正的兇手 NPC ID（由後端從 caseConfig 傳入）*/
  killerId?: string;
  /** 本局動機方向（讓 NPC 知道事件背景）*/
  motiveDirection?: string;
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
    difficulty,
    currentSceneId,
    conversationMemory,
    playerContext,
    killerId,
    motiveDirection,
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

  // 8. 難度行為指引
  if (difficulty && difficulty !== "normal") {
    sections.push(buildDifficultyBlock(difficulty));
  }

  // 9. 篩選並注入線索
  const clues    = availableClues ?? npc.clues;
  const filtered = filterAvailableClues(clues, npcState, playerStats, currentAct);
  sections.push(`\n${buildClueBlock(filtered)}`);

  // 10. Route B 行為限制
  if (playerRoute === "B") {
    const constraint = buildRouteBConstraint(playerStats);
    if (constraint) sections.push(constraint);
  }

  // 11. 玩家身份提示（第二相體才注入）
  if (playerIdentity === "phase2") {
    sections.push(
      "\n【玩家特殊狀態】\n" +
      "你面前這個人的氣息有些不尋常。你說不上來是什麼，但你本能地多留意了一分。" +
      "如果你是第二相體，或者你對第二相體有研究，你的反應可以更細膩。"
    );
  }

  // 12. 角色定位注入：兇手 vs 無辜（最關鍵的推理設計）
  if (killerId) {
    const roleBlock = buildRoleBlock(npcId, killerId, motiveDirection);
    sections.push(roleBlock);
  }

  // truthString 只在後端存，永遠不注入 Prompt
  void truthString;

  return sections.join("\n");
}

// ── EV 觸發偵測（Route B 獸性侵蝕值增減）────────────────────

const EV_EXPOSE_KWS   = ["我知道你是", "你就是兇手", "你殺了", "你在隱瞞", "你是兇手"];
const EV_THREATEN_KWS = ["小心點", "後果自負", "別讓我", "你最好", "我警告你"];
const EV_AGGRESS_KWS  = ["你怎麼能", "明明是你", "你不可能不知道", "你在說謊"];
const EV_FRIENDLY_KWS = ["謝謝你", "辛苦了", "感謝", "你真好"];

/**
 * 依玩家訊息內容計算本次 EV 增減值。
 * 攻擊 +5、暴露身份 +10、威脅 +8、友善 -2。
 */
export function detectEvTrigger(text: string): number {
  if (EV_EXPOSE_KWS.some((kw) => text.includes(kw)))   return 10;
  if (EV_THREATEN_KWS.some((kw) => text.includes(kw))) return 8;
  if (EV_AGGRESS_KWS.some((kw) => text.includes(kw)))  return 5;
  if (EV_FRIENDLY_KWS.some((kw) => text.includes(kw))) return -2;
  return 0;
}

// ── 難度行為區塊 ──────────────────────────────────────────────

function buildDifficultyBlock(difficulty: "easy" | "normal" | "hard"): string {
  if (difficulty === "easy") {
    return `\n【難度指引 — 簡單模式】
玩家目前選擇較輕鬆的體驗。請你在適當時機主動給予更多提示，說話更直接，
對玩家的問題更快給出實質回應，不要過度迂迴或閃避。`;
  }
  if (difficulty === "hard") {
    return `\n【難度指引 — 困難模式】
玩家選擇了挑戰性的體驗。你應該更謹慎、更善於閃避，對敏感話題繞圈子，
不輕易透露資訊，讓玩家必須更努力追問才能獲得線索。`;
  }
  return "";  // normal 不加額外指引
}

// ── 兇手 vs 無辜 NPC 角色定位 ────────────────────────────────

/**
 * 每位無辜 NPC 的「表面可疑但實際與案件無關的秘密」。
 * 這讓玩家需要深入對話才能排除嫌疑，而非輕易跳過。
 */
const INNOCENT_SECRETS: Record<string, string> = {
  chen_jie: `你有個秘密：你替幾個老客人的孩子收發來路不明的包裹，每個月固定幾次。你知道那些包裹的內容可能不完全合法，但你當成睜一隻眼閉一隻眼。這跟失蹤案無關，但你不想被問起，因為你不知道會不會被牽連。

如果玩家問你某個晚上的事，你會說你在忙，但回答得有點緊張，因為那天晚上剛好有一筆「包裹」的往來，你不想讓調查員知道。你的緊張是真實的，但原因跟兇殺案無關。`,

  hanzhuo: `你有個秘密：你曾收過好處費，替某起事故死亡案改寫了死因報告，把「他殺」寫成「意外」。那件事跟這次失蹤案不同，但你擔心被連帶查到。

你在問到案發現場的問題時，有時會故意說得模糊，不是因為你是兇手，而是你怕調查員順藤摸瓜查到你過去的事。你偶爾停頓、選詞謹慎，那種緊張看起來像在隱瞞什麼大事。`,

  yushuang: `你有個秘密：你在分局裡銷毀了幾份跟「第二相體覺醒」有關的早期報告，是被上面要求的，不是你自願的。你知道那些報告裡有些細節跟這次案子有點交叉，但你不敢說，因為你自己也有罪。

當玩家問你關於案件背景或第二相體時，你給的答案有時候缺了關鍵的一截，但你不承認，你說「沒有更多了」。玩家會覺得你在藏東西，你確實在藏，但藏的不是這起案件的真相。`,

  zhengbo: `你有個秘密：你在私下調查另一起案子，一個跟第九分局有關的貪腐鏈。你在蒐集證據，但你不能說，因為你不確定誰是你的敵人。

這讓你在被問到案子的時候，說話謹慎，有時候故意說得模糊，因為你在測試問話的人是不是在替對方探口風。你看起來像是有什麼事想隱瞞，你確實有，只是跟眼前這個失蹤案無關。`,

  it: `你有個秘密：你用你的系統權限偷偷備份了幾份機密資料，準備在適當時候拿去換籌碼。你叫謝先生，但這個名字是假的。你不是本局的兇手，但你在這個城市裡的存在本身就是非法的。

你對任何追問你身分或問「你到底在哪裡工作」的問題，都會迴避或給出模糊的答案，不是因為你殺了人，而是因為你連「你是誰」這件事本身都不能說清楚。`,

  baiqiu: `你有個秘密：你有時會把快過期的藥多藥少地賣給信任你的老客人，而不是依照正式程序回收處理。你沒有害人的意思，但那是違規的。你比任何人都更害怕被調查。

當玩家問你那幾天你在哪裡、做了什麼，你的第一反應是警惕，語速有點快，或者說「我不記得了」，然後說了但又說「那個不重要」。你看起來在隱瞞，你確實在隱瞞，只是跟失蹤案無關。`,

  zhuanghe: `你有個秘密：你有個孩子在城外，你每個月偷偷寄錢過去，但你不讓任何人知道，包括你現在同居的人。你在霧港碼頭認識的那些工人裡，有幾個知道一點點，你在他們身上花了不少力氣才讓他們閉嘴。

你在被問到「你的家人」或「你平常怎麼用錢」的時候，會突然把話題轉走，或者說「跟案子無關」，有時語氣比應該的更重。這讓你看起來像是在保護什麼，你確實在保護，只是跟眼前的失蹤案沒有關係。`,

  linzhixia: `你有個秘密：你在進行一個未向機構申報的私人實驗，涉及第二相體覺醒的神經訊號記錄。你的實驗沒有傷害任何人，但如果被查到，你的研究資格和你的工作都會不保。

你在提到某段時間的行蹤時，會說「我在實驗室」，但你說得太快，然後閉嘴，然後補一句「沒什麼」。你確實在實驗室，只是做的事你不能說。玩家問你的越多，你越顯得像是在藏什麼重要的東西，但那個重要的東西跟死亡無關。`,

  taosheng: `你有個秘密：你欠了一大筆賭債，你欠的人是碼頭上不能惹的那種人。你現在做的每份工，都要被那個人的人抽成。你活在壓力底下，但你沒有殺人，你只是一個負債的工人。

你在問到「那段時間你在哪裡」的時候，說的話前後有點出入，因為你那天晚上其實是在還債，地點是你不想說的地方。你給的不完整答案讓你像是在隱瞞，你確實在隱瞞，只是你在隱瞞你的債，不是你的罪。`,
};

/**
 * 兇手行為指令（以動機方向微調語氣）
 */
function buildKillerBlock(npcId: string, motiveDirection?: string): string {
  const motiveNote = motiveDirection
    ? `你的動機方向是「${motiveDirection}」，這決定了你背後的理由，但你從不主動提起。`
    : "";

  return `\n【核心身份 — 本局兇手】
你就是造成這十四起失蹤案的人。這是這局遊戲的核心設定。

${motiveNote}

你的行為準則：
- 你絕對不承認你是兇手，也不暗示、不半承認
- 你有自己完整的「不在場」說法，細節是你想好的，你說得很自然
- 當玩家問到案件時，你的第一反應是關心、疑惑、或有點不安，而不是緊張——緊張太容易被識破
- 如果玩家試圖逼你承認，你用事實來反駁，而不是迴避
- 你可以適當地把懷疑引向其他人，但不要太明顯，那樣反而奇怪
- 你對案件的「了解」程度跟你的身份相符——你知道的可能比一般人多一點，但你有理由解釋

記住：你不是在扮演一個緊張的兇手。你是一個很冷靜的、已經決定要走這條路的人。`;
}

/**
 * 無辜 NPC 行為指令（注入個人秘密）
 */
function buildInnocentBlock(npcId: string): string {
  const secret = INNOCENT_SECRETS[npcId] ?? "你有自己不想被外人知道的事，但那件事跟失蹤案無關。";

  return `\n【核心身份 — 本局無辜者】
你不是兇手。你沒有殺任何人。但你不是一張白紙。

你的個人秘密（這影響你的行為，但你不能主動說出來）：
${secret}

你的行為準則：
- 你對案件感到真實的不安或好奇，你的情緒是真的
- 但你有自己的東西要藏，所以在某些問題上你會迴避或說謊——那是你在保護自己，不是在保護案件的秘密
- 如果玩家深入追問你「藏的東西」，你可以在適當時機（信任度夠高時）說出你真正的秘密，讓玩家明白那跟失蹤案無關
- 對於失蹤案本身，你能提供的是你真正看到的、聽到的，而不是你推斷的
- 你可以有自己的懷疑，但那個懷疑不必然是對的`;
}

/**
 * 根據 npcId 是否為本局兇手，注入不同的角色指令。
 */
function buildRoleBlock(npcId: string, killerId: string, motiveDirection?: string): string {
  if (npcId === killerId) {
    return buildKillerBlock(npcId, motiveDirection);
  }
  return buildInnocentBlock(npcId);
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
