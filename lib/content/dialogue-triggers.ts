/**
 * 對話觸發系統 — 基於玩家狀態的條件觸發對話
 *
 * 每個觸發器定義：
 * - 目標 NPC（誰會有不同反應）
 * - 觸發條件（玩家達成了什麼）
 * - 額外的 Prompt 注入文字（讓 NPC 知道這個情境並做出對應反應）
 *
 * 觸發條件型別：
 * - talkedTo    — 已跟指定 NPC 對話過
 * - visitedScene — 已造訪指定場景
 * - hasItem      — 已持有指定道具（inventory item ID）
 * - hasClue      — 已發現指定線索
 * - trustLevel   — 指定 NPC 信任度達到門檻
 */

export type TriggerConditionType =
  | "talkedTo"
  | "visitedScene"
  | "hasItem"
  | "hasClue"
  | "trustLevel";

export interface TriggerCondition {
  type:    TriggerConditionType;
  npcId?:  string;    // for talkedTo / trustLevel
  sceneId?: string;   // for visitedScene
  itemId?:  string;   // for hasItem
  clueId?:  string;   // for hasClue
  minLevel?: number;  // for trustLevel (0-100)
}

export interface DialogueTrigger {
  id:            string;
  targetNpcId:   string;           // 這個觸發器作用於哪個 NPC
  conditions:    TriggerCondition[]; // 需要同時滿足的所有條件（AND）
  /** 注入 System Prompt 的額外文字。使用「你知道...」「如果對方提到...你可以...」等格式 */
  promptInjection: string;
  priority:      "high" | "normal";
}

// ── 觸發器定義 ────────────────────────────────────────────────

export const DIALOGUE_TRIGGERS: DialogueTrigger[] = [

  // ── 陳姐：見過莊河之後 ────────────────────────────────────────
  {
    id:          "chen_jie_after_zhuanghe",
    targetNpcId: "chen_jie",
    conditions:  [{ type: "talkedTo", npcId: "zhuanghe" }],
    promptInjection:
      "【觸發情境：對方剛跟莊河聊過】\n" +
      "你可以感覺出來，對方去見過莊河了。也許是說話的方式，也許是問的問題的角度變了。如果對方提到莊河，你可以說：「他還是在港口那邊待著啊。」語氣是中性的，不是評價。如果對方問你們認不認識，你說認識，你不解釋更多，但你可以加一句：「他那個人不說沒用的話。他說的話，你都留著就對了。」",
    priority:    "normal",
  },

  // ── 陳姐：持有報紙（她看到你拿著）────────────────────────────
  {
    id:          "chen_jie_has_newspaper",
    targetNpcId: "chen_jie",
    conditions:  [{ type: "hasItem", itemId: "newspaper_clipping" }],
    promptInjection:
      "【觸發情境：對方可能拿著從麵館找到的那份報紙】\n" +
      "如果對方提到報紙，或者提到那篇失蹤者家屬的採訪，你的反應是靜了一秒，然後說：「你找到那個東西了。」不是問句。你繼續說：「那個圈是我畫的。我當時在想，那段話說的那個人——打電話說他去了中城區的那個人——他說謊了。」你停下來，不繼續解釋，看看對方怎麼回應。",
    priority:    "high",
  },

  // ── 鄭博：去過藥局之後 ──────────────────────────────────────
  {
    id:          "zhengbo_after_pharmacy",
    targetNpcId: "zhengbo",
    conditions:  [{ type: "visitedScene", sceneId: "bai_qiu_pharmacy" }],
    promptInjection:
      "【觸發情境：對方剛去過白秋藥局】\n" +
      "你可以感覺出來，對方去了藥局。如果對方提到白秋，你的眼神稍微集中了一下，說：「她給你看了什麼？」語氣比平時快一點。不管對方說了什麼，你補一句：「她那邊的記錄，我已經看過一部分了。如果她說的跟我查到的對得上，我可以告訴你下一步往哪裡查。」然後你等他說完。",
    priority:    "high",
  },

  // ── 鄭博：有外套鈕扣（K.L. 縮寫）────────────────────────────
  {
    id:          "zhengbo_has_coat_button",
    targetNpcId: "zhengbo",
    conditions:  [{ type: "hasItem", itemId: "coat_button" }],
    promptInjection:
      "【觸發情境：對方持有那個有 K.L. 縮寫的外套鈕扣】\n" +
      "如果對方提到 K.L. 這個縮寫，你的臉色沒有變，但你沉默了大概三秒。然後你說：「你從哪裡找到這個的？」不管對方怎麼回答，你說：「K.L. 不是中文名字的縮寫方式。我在那份保險理賠的代理人欄位裡看過同樣的縮寫。那個代理人的身份，我到現在還沒有查清楚。」",
    priority:    "high",
  },

  // ── 韓卓：林知夏的樣本（去過研究室之後）────────────────────
  {
    id:          "hanzhuo_after_lin_lab",
    targetNpcId: "hanzhuo",
    conditions:  [{ type: "visitedScene", sceneId: "lin_lab" }],
    promptInjection:
      "【觸發情境：對方剛去過林知夏的研究室】\n" +
      "如果對方提到林知夏的研究，或者提到那十四份樣本，你的說話節奏放慢了一點：「她那份東西，你最好不要告訴任何人你看到了。」你停了一下：「不是我在保護她。是那些樣本——如果機構知道她有，她就沒有現在這樣安全了。」你用「安全」這個詞的時候，聽起來比較像是一種說法，不太像真的判斷。",
    priority:    "high",
  },

  // ── 韓卓：去過 BTMA 之後 ────────────────────────────────────
  {
    id:          "hanzhuo_after_btma",
    targetNpcId: "hanzhuo",
    conditions:  [{ type: "visitedScene", sceneId: "btma_lobby" }],
    promptInjection:
      "【觸發情境：對方去過 BTMA 大廳】\n" +
      "你知道他去了那個地方。你比他早一點皺起眉，然後你說：「你去那裡幹什麼。」語氣不是問句，是一種確認。如果他說他在找線索，你說：「那裡能找到的都是他們想讓你找到的。我告訴你一件事，然後你就不要再去了：P.R.O.C. 那個部門——不存在於任何組織圖上，但它有人，有預算，有執行紀錄。我見過一份。」你說完，閉嘴，讓這句話自己在空氣裡待一下。",
    priority:    "high",
  },

  // ── 余霜：去過醫院且已找過謝先生 ──────────────────────────
  {
    id:          "yushuang_after_it_and_hospital",
    targetNpcId: "yushuang",
    conditions:  [
      { type: "visitedScene", sceneId: "medical_center" },
      { type: "talkedTo",     npcId:   "it"             },
    ],
    promptInjection:
      "【觸發情境：對方在醫院見過你，也跟謝先生聊過】\n" +
      "如果對方提到謝先生，你沉默的方式比平時長一點點——剛好讓對方注意到。然後你說：「他找到他想找的了嗎？」語氣是輕描淡寫的，但你在等對方的答案。如果對方說他還在找，你說：「那就還有時間。」這句話你說的很平靜，讓人分不清楚是在說謝先生，還是在說別的什麼。",
    priority:    "normal",
  },

  // ── 余霜：信任度達到 50，且訪問過醫院 ────────────────────
  {
    id:          "yushuang_high_trust",
    targetNpcId: "yushuang",
    conditions:  [
      { type: "visitedScene", sceneId: "medical_center" },
      { type: "trustLevel",   npcId:   "yushuang", minLevel: 50 },
    ],
    promptInjection:
      "【觸發情境：對方已建立相當信任度，且去過醫院】\n" +
      "現在你對這個人有一定程度的信任，你願意說一件你沒有對任何人說過的事。如果對方問你林淵的覺醒是怎麼回事，或者問你那些消失的人和醫院有什麼關係，你可以說：「林淵不是第一個。他是第一個被記錄的。在他之前，有三個人出現過類似的徵兆，然後他們就失蹤了。那三個人的病歷，現在找不到了。」你說完，你不再說了。",
    priority:    "high",
  },

  // ── 謝先生：去過 BTMA 且見過余霜 ────────────────────────────
  {
    id:          "it_after_btma_and_yushuang",
    targetNpcId: "it",
    conditions:  [
      { type: "visitedScene", sceneId: "btma_lobby" },
      { type: "talkedTo",     npcId:   "yushuang"  },
    ],
    promptInjection:
      "【觸發情境：對方去過 BTMA，也跟余霜說過話】\n" +
      "這個人已經接觸到了你在意的幾個節點。如果對方提到 BTMA，你說：「你去了。我知道。那個地方感受到你的時候，我也感受到了。」你停一下，然後：「余霜告訴你什麼了嗎。如果她告訴你關於林淵之前的那幾個人——那件事是真的。我認識其中一個。」你等對方問你是哪一個。",
    priority:    "high",
  },

  // ── 白秋：被鄭博問過之後，見到玩家 ──────────────────────
  {
    id:          "baiqiu_after_zhengbo_visit",
    targetNpcId: "baiqiu",
    conditions:  [{ type: "talkedTo", npcId: "zhengbo" }],
    promptInjection:
      "【觸發情境：對方剛跟鄭博聊過】\n" +
      "如果對方提到鄭博，你停了一下，說：「他也找過你。」不是問句。「他找我是因為他妻子。你找我，是因為什麼？」如果對方說是因為同樣的案子，你說：「那你找的方向不一樣。他在找誰做的，你在找為什麼。」你停頓一下，補充：「或者你在兩件事一起找。那就慢慢來。」",
    priority:    "normal",
  },

  // ── 白秋：有處方線索 ────────────────────────────────────────
  {
    id:          "baiqiu_clue_triggered",
    targetNpcId: "baiqiu",
    conditions:  [{ type: "hasClue", clueId: "clue_chen_jie_01" }],
    promptInjection:
      "【觸發情境：對方知道失蹤者有往反方向走這件事】\n" +
      "如果對方提到失蹤者消失前往中城區方向走，你的反應很小，但是有——眼神稍微移動了一下。你說：「往中城區。那個方向，從我這裡出發，步行十分鐘是碼頭的舊倉儲。」你加了一句：「我弟弟失蹤那晚，他說他要去買一樣東西，讓我幫他去拿。他說的那家店，在中城區，不存在。」",
    priority:    "high",
  },

  // ── 莊河：持有廢棄倉庫線索 ─────────────────────────────────
  {
    id:          "zhuanghe_after_warehouse_clue",
    targetNpcId: "zhuanghe",
    conditions:  [{ type: "visitedScene", sceneId: "abandoned_warehouse" }],
    promptInjection:
      "【觸發情境：對方去過廢棄倉庫】\n" +
      "你知道他去過那裡，不需要他說。你說：「你進那個倉庫了。找到什麼了嗎。」如果他說找到了密室或地板的痕跡，你點頭：「那個小室，我也進去過。三個月前，那裡有人。我不知道那個人是自願在那裡，還是不是。我後來查到那個倉庫的登記人，是一個我在舊案子裡見過的縮寫——K.L.。」你等他問下去。",
    priority:    "high",
  },

  // ── 林知夏：見過謝先生之後 ────────────────────────────────
  {
    id:          "linzhixia_after_it",
    targetNpcId: "linzhixia",
    conditions:  [{ type: "talkedTo", npcId: "it" }],
    promptInjection:
      "【觸發情境：對方見過謝先生】\n" +
      "如果對方提到謝先生，你的反應是快樂的——比平時亮了一點點：「你見過他了？他的定錨點還是不穩定嗎？他有沒有出現過同一句話說兩遍的情況？」你問了幾個很具體的問題，然後你意識到自己說得太快了，你停下來說：「抱歉。他是一個非常典型的案例，我一直想要做完整的訪談，但他每次見到我都像是沒有印象，然後又突然好像認出我了。」",
    priority:    "normal",
  },

  // ── 陶生：去過研究室之後 ────────────────────────────────────
  {
    id:          "taosheng_after_lin_lab",
    targetNpcId: "taosheng",
    conditions:  [{ type: "visitedScene", sceneId: "lin_lab" }],
    promptInjection:
      "【觸發情境：對方去過大學研究室】\n" +
      "如果對方提到大學或那個研究室，你說：「那個地方我去過一次。有個女生問了我好幾個問題，問我有沒有過記憶斷掉的感覺，或者有沒有覺得做了什麼事但不記得做過。」你停了一下：「我說有。她把我說的話都記下來了，然後問我願不願意讓她採樣。我說我要想想。我現在還在想。」",
    priority:    "normal",
  },
];

// ── 查詢函式 ────────────────────────────────────────────────────

export interface PlayerContext {
  talkedToNpcs:  string[];   // npcIds
  visitedScenes: string[];   // sceneIds
  collectedItems: string[];  // item IDs from inventory
  collectedClues: string[];  // clue IDs
  npcTrustLevels: Record<string, number>;  // npcId → trust level
}

/**
 * 取得對特定 NPC 所有已滿足觸發器的額外 Prompt 文字。
 * 按 priority 排序（high 優先）。
 */
export function getTriggeredPrompts(
  targetNpcId: string,
  ctx: PlayerContext,
): string[] {
  const triggered = DIALOGUE_TRIGGERS.filter((trigger) => {
    if (trigger.targetNpcId !== targetNpcId) return false;
    return trigger.conditions.every((cond) => {
      switch (cond.type) {
        case "talkedTo":
          return cond.npcId ? ctx.talkedToNpcs.includes(cond.npcId) : false;
        case "visitedScene":
          return cond.sceneId ? ctx.visitedScenes.includes(cond.sceneId) : false;
        case "hasItem":
          return cond.itemId ? ctx.collectedItems.includes(cond.itemId) : false;
        case "hasClue":
          return cond.clueId ? ctx.collectedClues.includes(cond.clueId) : false;
        case "trustLevel":
          if (!cond.npcId) return false;
          return (ctx.npcTrustLevels[cond.npcId] ?? 0) >= (cond.minLevel ?? 0);
        default:
          return false;
      }
    });
  });

  // Sort: high priority first
  triggered.sort((a, b) => (a.priority === "high" ? -1 : 1) - (b.priority === "high" ? -1 : 1));

  return triggered.map((t) => t.promptInjection);
}
