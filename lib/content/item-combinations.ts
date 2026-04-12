/**
 * 道具組合系統 — 定義哪些道具組合會產生新的發現
 */

export interface CombinationResult {
  title:       string;
  description: string;
  discoveryId: string;
}

export interface ItemCombination {
  itemId1:   string;
  itemId2:   string;
  result:    CombinationResult;
}

export const ITEM_COMBINATIONS: ItemCombination[] = [
  {
    itemId1: "medical_report",
    itemId2: "lab_results",
    result: {
      title:       "醫療數據矛盾",
      description: "醫療報告上的數值與實驗室結果出入極大。某人竄改了其中一份——或者兩份都動過手腳。",
      discoveryId: "evidence_link_medical",
    },
  },
  {
    itemId1: "warehouse_key",
    itemId2: "mysterious_map",
    result: {
      title:       "廢棄倉庫地圖",
      description: "地圖上標注的位置與倉庫鑰匙的編號完全吻合。這把鑰匙通往的地方，正是地圖上標示的「X」。",
      discoveryId: "evidence_link_warehouse",
    },
  },
  {
    itemId1: "torn_photo",
    itemId2: "photo_fragment",
    result: {
      title:       "完整照片",
      description: "兩張殘片拼合起來——照片裡的人不止一個。第二個人的臉被刻意撕去，但背景的建築認得出來。",
      discoveryId: "evidence_link_photo",
    },
  },
  {
    itemId1: "anonymous_note",
    itemId2: "handwriting_sample",
    result: {
      title:       "筆跡比對",
      description: "匿名信與筆跡樣本出自同一人。字體的特殊習慣——某幾個字的收筆方式——無法造假。",
      discoveryId: "evidence_link_handwriting",
    },
  },
  {
    itemId1: "phone_records",
    itemId2: "schedule_sheet",
    result: {
      title:       "時間線重疊",
      description: "通話記錄與行程表比對後，某人聲稱的不在場證明出現了一個三十分鐘的空窗。剛好足夠了。",
      discoveryId: "evidence_link_timeline",
    },
  },
  {
    itemId1: "chemical_sample",
    itemId2: "prescription_bottle",
    result: {
      title:       "藥物來源追蹤",
      description: "化學樣本的成分與處方瓶中的殘留物完全一致。這種藥物只有特定管道才能取得。",
      discoveryId: "evidence_link_chemical",
    },
  },
  {
    itemId1: "security_badge",
    itemId2: "access_log",
    result: {
      title:       "門禁記錄漏洞",
      description: "門禁卡與進出記錄對照後，有一次刷卡在官方記錄裡被抹去了。有人動過系統日誌。",
      discoveryId: "evidence_link_access",
    },
  },
];

export function tryItemCombination(
  itemId1: string,
  itemId2: string,
): CombinationResult | null {
  for (const combo of ITEM_COMBINATIONS) {
    if (
      (combo.itemId1 === itemId1 && combo.itemId2 === itemId2) ||
      (combo.itemId1 === itemId2 && combo.itemId2 === itemId1)
    ) {
      return combo.result;
    }
  }
  return null;
}
