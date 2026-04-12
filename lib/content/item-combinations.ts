/**
 * 道具組合配方 — 定義哪些道具組合後能產生新線索
 *
 * 組合邏輯：玩家在道具欄選取兩個道具，系統查詢此表，
 * 若找到匹配的配方，則新增結果線索並（視設定）消耗原始道具。
 *
 * 呼叫方：app/game/[sessionId]/inventory/page.tsx「組合」按鈕
 */

export interface ItemCombinationResult {
  clue_text:    string;
  clue_type:    "deduced";
  category:     "relationship" | "motive" | "method" | "alibi" | "general";
  description:  string;   // 顯示給玩家的推理過程
  consumeItems: boolean;  // 組合後是否消耗原始道具
}

export interface ItemCombinationRecipe {
  id:       string;
  itemA:    string;  // item_name 關鍵字（模糊匹配）
  itemB:    string;
  result:   ItemCombinationResult;
  requires?: {
    actMin?:       number;
    visitedScene?: string;
  };
}

export const ITEM_COMBINATIONS: ItemCombinationRecipe[] = [

  // ── 藥品類 ────────────────────────────────────────────────

  {
    id:    "combo_drug_prescription",
    itemA: "處方箋",
    itemB: "藥局收據",
    result: {
      clue_text:   "處方箋上的醫師簽名與收據上的診所名稱對不上——這批藥的來源存在問題。",
      clue_type:   "deduced",
      category:    "method",
      description: "你把兩份文件擺在一起，發現了明顯的矛盾。",
      consumeItems: false,
    },
  },
  {
    id:    "combo_vial_report",
    itemA: "空藥瓶",
    itemB: "醫療報告",
    result: {
      clue_text:   "空藥瓶的批號對應到醫療報告中一個「實驗性用藥」的欄位，但那個欄位被塗改過。",
      clue_type:   "deduced",
      category:    "method",
      description: "批號是假的，或者報告是假的——兩者不可能都是真的。",
      consumeItems: false,
    },
  },

  // ── 文件類 ────────────────────────────────────────────────

  {
    id:    "combo_contract_photo",
    itemA: "合約副本",
    itemB: "照片",
    result: {
      clue_text:   "照片裡出現的人，正是合約上的簽名人之一。但合約聲稱那個人在案發當天不在這座城市。",
      clue_type:   "deduced",
      category:    "alibi",
      description: "不在場的人卻出現在照片裡——有人在撒謊。",
      consumeItems: false,
    },
  },
  {
    id:    "combo_keycard_access_log",
    itemA: "門禁卡",
    itemB: "進出紀錄",
    result: {
      clue_text:   "門禁卡的序號對應到進出紀錄裡一筆「訪客」的進場記錄，但那個訪客從未登出——他在建築物裡消失了。",
      clue_type:   "deduced",
      category:    "method",
      description: "你追蹤到最後一次感應紀錄，然後記錄中斷了。",
      consumeItems: false,
    },
  },
  {
    id:    "combo_note_map",
    itemA: "紙條",
    itemB: "舊地圖",
    result: {
      clue_text:   "紙條上的座標對應到舊地圖裡一個已拆除的建築位置——那裡曾經是一個私人研究設施。",
      clue_type:   "deduced",
      category:    "general",
      description: "你把座標標記在地圖上，找到了一個不應該存在的地點。",
      consumeItems: true,
    },
  },

  // ── 個人物品類 ────────────────────────────────────────────

  {
    id:    "combo_watch_receipt",
    itemA: "手錶",
    itemB: "修錶收據",
    result: {
      clue_text:   "手錶的停止時間和修錶收據上的送修時間矛盾——這支錶從來沒有送去修過，它的時間是被刻意調慢的。",
      clue_type:   "deduced",
      category:    "alibi",
      description: "誰需要偽造一個時間？誰的不在場證明依賴於這個時間？",
      consumeItems: false,
    },
  },
  {
    id:    "combo_phone_bill_name_list",
    itemA: "通話記錄",
    itemB: "名單",
    result: {
      clue_text:   "通話記錄裡有三個號碼沒有對應身份，但其中一個號碼的尾數出現在名單的備注欄裡。",
      clue_type:   "deduced",
      category:    "relationship",
      description: "一個隱藏的聯繫——有人不想讓人知道他們之間有過通話。",
      consumeItems: false,
    },
  },

  // ── 物證類 ────────────────────────────────────────────────

  {
    id:    "combo_bloodstain_lab_result",
    itemA: "血跡樣本",
    itemB: "鑑識報告",
    result: {
      clue_text:   "血跡樣本的 DNA 和鑑識報告裡的「被害人樣本」不符——現場的血不全是被害人的。",
      clue_type:   "deduced",
      category:    "method",
      description: "現場有另一個人的血跡，但沒有出現在任何報告裡。",
      consumeItems: false,
    },
  },
  {
    id:    "combo_key_safe_note",
    itemA: "鑰匙",
    itemB: "保險箱密碼",
    result: {
      clue_text:   "這把鑰匙不是保險箱的鑰匙，但紙條上的數字是一組日期——某個你已經聽說過的日期。",
      clue_type:   "deduced",
      category:    "motive",
      description: "數字不是密碼，是日期。有什麼事在那天發生了。",
      consumeItems: false,
    },
  },

  // ── 數位證據 ──────────────────────────────────────────────

  {
    id:    "combo_usb_encrypted_file",
    itemA: "隨身碟",
    itemB: "加密檔案密碼",
    result: {
      clue_text:   "隨身碟裡有一份完整的內部通訊記錄，涵蓋案發前六個月。其中一段訊息明確提到被害人的名字和一個計畫代號。",
      clue_type:   "deduced",
      category:    "motive",
      description: "你解開了加密——裡面的東西比你預期的更完整，也更危險。",
      consumeItems: false,
    },
    requires: { actMin: 2 },
  },
  {
    id:    "combo_sim_card_location_data",
    itemA: "SIM 卡",
    itemB: "基地台位置記錄",
    result: {
      clue_text:   "SIM 卡的連線記錄顯示，那支手機在案發當晚曾出現在犯罪現場附近，但機主聲稱那天手機掉了。",
      clue_type:   "deduced",
      category:    "alibi",
      description: "手機的足跡說謊了——或者機主說謊了。",
      consumeItems: false,
    },
    requires: { actMin: 2 },
  },
];

// ── 查詢函式 ──────────────────────────────────────────────────

/**
 * 找到符合兩個道具名稱（關鍵字匹配）的組合配方。
 * 配方是對稱的（A+B = B+A）。
 */
export function findItemCombination(
  itemNameA:     string,
  itemNameB:     string,
  currentAct:    number   = 1,
  visitedScenes: string[] = [],
): ItemCombinationRecipe | null {
  const aLower = itemNameA.toLowerCase();
  const bLower = itemNameB.toLowerCase();

  for (const recipe of ITEM_COMBINATIONS) {
    const rA = recipe.itemA.toLowerCase();
    const rB = recipe.itemB.toLowerCase();

    const forward  = (aLower.includes(rA) || rA.includes(aLower)) && (bLower.includes(rB) || rB.includes(bLower));
    const backward = (aLower.includes(rB) || rB.includes(aLower)) && (bLower.includes(rA) || rA.includes(bLower));

    if (!forward && !backward) continue;

    const req = recipe.requires;
    if (req) {
      if (req.actMin !== undefined && currentAct < req.actMin) continue;
      if (req.visitedScene !== undefined && !visitedScenes.includes(req.visitedScene)) continue;
    }

    return recipe;
  }
  return null;
}

/** 取得所有可用組合（供道具欄顯示組合提示）*/
export function getAvailableCombinations(
  ownedItemNames: string[],
  currentAct:     number = 1,
): ItemCombinationRecipe[] {
  return ITEM_COMBINATIONS.filter((recipe) => {
    const req = recipe.requires;
    if (req?.actMin !== undefined && currentAct < req.actMin) return false;

    const match = (owned: string[], keyword: string) =>
      owned.some((n) => {
        const nl = n.toLowerCase();
        const kl = keyword.toLowerCase();
        return nl.includes(kl) || kl.includes(nl);
      });

    return match(ownedItemNames, recipe.itemA) && match(ownedItemNames, recipe.itemB);
  });
}
