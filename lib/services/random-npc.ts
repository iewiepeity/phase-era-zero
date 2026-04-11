/**
 * 隨機 NPC Service — 場景選取與 System Prompt 組裝
 *
 * - getRandomNpcsForScene()     — 根據 sessionId + sceneId 確定性選出 1-2 個路人
 * - isRandomNpc()               — 判斷 npcId 是否屬於隨機 NPC
 * - getRandomNpcById()          — 依 id 取得隨機 NPC 模板
 * - buildRandomNpcPrompt()      — 組裝含暗示的 System Prompt
 */

import { RANDOM_NPC_POOL, type RandomNpcTemplate } from "@/lib/content/random-npcs";
import { selectHint, type HintSelectionContext } from "@/lib/content/random-npc-hints";

// ── 工具函式 ─────────────────────────────────────────────────

/**
 * 確定性字串雜湊（djb2 變體）。
 * 相同字串永遠返回相同的正整數，用於 seed。
 */
function hashStr(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 33) ^ str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ── 公開函式 ─────────────────────────────────────────────────

/** 判斷 npcId 是否屬於隨機路人 NPC */
export function isRandomNpc(npcId: string): boolean {
  return npcId.startsWith("rnd_");
}

/** 依 id 取得隨機 NPC 模板（找不到則返回 null）*/
export function getRandomNpcById(npcId: string): RandomNpcTemplate | null {
  return RANDOM_NPC_POOL.find((n) => n.id === npcId) ?? null;
}

/**
 * 根據場景和 sessionId 確定性地選出 1-2 個隨機 NPC。
 * - 同一 sessionId + sceneId 組合：永遠返回相同的 NPC
 * - 不同 session（不同局）：返回不同 NPC
 */
export function getRandomNpcsForScene(
  sceneId:   string,
  sessionId: string,
): RandomNpcTemplate[] {
  // 只取可在此場景出現的 NPC
  const eligible = RANDOM_NPC_POOL.filter(
    (n) => n.scenes.includes(sceneId) || n.scenes.includes("*"),
  );
  if (eligible.length === 0) return [];

  const seed1 = hashStr(sessionId + "|" + sceneId);
  const seed2 = hashStr(sessionId + "|" + sceneId + "|2");

  const first  = eligible[seed1 % eligible.length];

  // 只在 eligible >= 2 時嘗試第二個
  if (eligible.length < 2) return [first];

  // 確保兩個不重複
  let secondIdx = seed2 % eligible.length;
  if (eligible[secondIdx].id === first.id) {
    secondIdx = (secondIdx + 1) % eligible.length;
  }
  const second = eligible[secondIdx];

  return [first, second];
}

/**
 * 組裝隨機 NPC 的 System Prompt，含一條暗示注入。
 *
 * @param npcId       - rnd_ 開頭的隨機 NPC id
 * @param gameState   - 玩家當前遊戲狀態（決定注入哪條暗示）
 */
export function buildRandomNpcPrompt(
  npcId: string,
  gameState: {
    sceneId:     string;
    sessionId:   string;
    visitedCount: number;
    clueCount:   number;
    talkedNpcs:  string[];
  },
): string {
  const template = getRandomNpcById(npcId);
  if (!template) {
    return "你是一個路人，不認識問你話的人，也不知道什麼特別的事情。";
  }

  const seed = hashStr(gameState.sessionId + "|" + npcId);

  // 選擇暗示
  const hintCtx: HintSelectionContext = {
    sceneId:      gameState.sceneId,
    visitedCount: gameState.visitedCount,
    clueCount:    gameState.clueCount,
    talkedNpcs:   gameState.talkedNpcs,
    seed,
  };

  // 從 NPC 自己的 hintPool 裡選，根據進度層級
  const progress: "early" | "mid" | "late" =
    gameState.visitedCount < 3 || gameState.clueCount < 3 ? "early" :
    gameState.visitedCount < 6 || gameState.clueCount < 7 ? "mid"   :
    "late";

  const npcHints = template.hintPool[progress];
  const selectedHint = npcHints.length > 0
    ? npcHints[seed % npcHints.length]
    : selectHint(hintCtx);

  // 性格說明
  const personalityDesc: Record<string, string> = {
    talky:   "你話比較多，容易和陌生人打開話匣子。",
    cold:    "你話不多，回應簡短，但你說的都是真話。",
    nervous: "你有點緊張，說話時會停一下想一下，但你不迴避問題。",
    casual:  "你說話隨意，不刻意，像在閒聊。",
  };

  const systemPrompt = [
    template.systemPrompt,
    "",
    personalityDesc[template.personality] ?? "",
    "",
    "【你在這個場景的角色】",
    `你是${template.profession}，在這裡是個路人，你不是主角，你只是剛好在這裡。你不知道任何陰謀，你只知道你觀察到的事情。`,
    "",
    "【對話規則】",
    "第一條：你不說你自己沒有觀察到的事，你說的是你真實遇到的。",
    "第二條：你的話題自然地往你知道的方向走，不刻意引導，但不迴避。",
    "第三條：在對話過程中，找一個自然的時機，不經意地提到下面這件事——",
    `「${selectedHint}」`,
    "提到的方式要符合你的性格，像是閒聊，不是在傳達情報，就是路人的日常觀察。",
    "第四條：如果對方問你不知道的事，你就說不知道，不要編造。",
    "",
    "【禁止事項】",
    "不說「身為 AI」或任何表明你是程式的話。",
    "不直接說出案件的答案，你不知道案件，你只是個路人。",
  ].join("\n");

  return systemPrompt;
}

/** 取得隨機 NPC 的打招呼語（用於對話頁面初始顯示）*/
export function getRandomNpcGreeting(npcId: string): string {
  const template = getRandomNpcById(npcId);
  if (!template) return "……";

  const greetings: Record<string, string[]> = {
    talky:   [
      "哦，你也在這裡？我就說這個地方最近人多了……",
      "你是來這裡的？我在這附近住了好幾年，你要問什麼都可以問。",
      "哎，你好你好，這附近找什麼嗎？",
    ],
    cold:    [
      "……",
      "有什麼事嗎。",
      "說吧。",
    ],
    nervous: [
      "哦，啊——你找我有什麼事嗎？",
      "我……我只是路過，你是要問什麼嗎？",
      "你是……從那邊來的嗎？",
    ],
    casual:  [
      "嗯，有什麼事嗎。",
      "來這裡幹嘛，找人嗎。",
      "哦你好，隨便坐啊。",
    ],
  };

  const seed = RANDOM_NPC_POOL.indexOf(template);
  const options = greetings[template.personality] ?? greetings.casual;
  return options[seed % options.length];
}
