/**
 * 鄭博動態線索模板
 *
 * 純文字模板，依本局 CaseConfig 過濾後產生 Clue[]。
 * 由 buildZhengboClues() 呼叫，注入 app/api/chat/route.ts。
 *
 * 循環依賴說明：
 *   clues-zhengbo.ts → npc-registry.ts（Clue 型別）
 *   clues-zhengbo.ts → case-config.ts（KillerId / MotiveDirection / CaseConfig）
 *   random-engine.ts  → clues-zhengbo.ts（buildZhengboClues）
 *   npc-registry.ts 不得 import clues-zhengbo.ts（會成環）
 */

import type { Clue } from "../npc-registry";
import type { KillerId, MotiveDirection, CaseConfig } from "../case-config";

// ── 內部型別 ─────────────────────────────────────────────────────

interface ClueTemplate {
  id: string;
  killerFilter?: KillerId[];
  motiveFilter?: MotiveDirection[];
  contentFn: (config: CaseConfig) => string;
  priority: "critical" | "major" | "minor";
  minAffinity: number;
  requiredAct: number;
  behaviorTrigger?: string;
  notBefore?: string[];
}

// ── 線索模板庫 ───────────────────────────────────────────────────

const ZHENGBO_CLUE_TEMPLATES: ClueTemplate[] = [
  // 通用線索：受害者共同地點（適用所有組合）
  {
    id: "zb_victim_list",
    contentFn: () =>
      "我整理了一份時間表。目前確認失蹤的人，包括陳瑤在內，所有人在失蹤前三週內都去過同一個地點——中城區錦和路 14 號，一棟看起來是普通辦公大樓的地方。沒有招牌，門禁卡進出，但附近有監視器紀錄到他們的臉。這不是巧合。",
    priority: "critical",
    minAffinity: 30,
    requiredAct: 1,
    behaviorTrigger: "shared_information_with_him",
  },

  // 動機方向 A（倖存者清算）：陳瑤說過某個人
  {
    id: "zb_first_victim_A",
    motiveFilter: ["A"],
    contentFn: () =>
      "陳瑤失蹤前三天……她提到過一個人。說那個人「欠了很多人的」。她說這句話的方式讓我注意到——不是閒聊，是那種你確定知道某件事的口氣。那個人的名字她沒說，但她有一個朋友可能知道。那個朋友後來也不見了。",
    priority: "major",
    minAffinity: 55,
    requiredAct: 2,
  },

  // 動機方向 B（滅口者）：保險異常快速批核
  {
    id: "zb_insurance_B",
    motiveFilter: ["B"],
    contentFn: () =>
      "我在理賠部門查過。失蹤者裡有六個人，他們的人壽保險理賠申請在失蹤後非常快就被批准了——快到不合理。正常流程要三個月，這幾件是三週。而且受益人在當事人失蹤前一到兩個月，都做過一次轉讓。有人在事前安排好了後事。",
    priority: "major",
    minAffinity: 55,
    requiredAct: 2,
    notBefore: ["zb_victim_list"],
  },

  // 動機方向 C（實驗失敗品）：健康研究計劃
  {
    id: "zb_pattern_C",
    motiveFilter: ["C"],
    contentFn: () =>
      "我拿到了幾份醫療紀錄——不是正式管道，你不要問怎麼拿的。失蹤者裡，有五個人有同一筆記錄：參加過一個叫做「健康研究計劃」的東西，時間是 P.E. 00 年到 01 年之間。主辦單位欄位是空的。參與者後來都有一段時間請了長假，理由各不相同。",
    priority: "major",
    minAffinity: 65,
    requiredAct: 2,
  },

  // 韓卓專屬：醫療人員外型的陌生人
  {
    id: "zb_killer_hanzhuo",
    killerFilter: ["hanzhuo"],
    contentFn: () =>
      "我有幾個失蹤者失蹤前的監視器截圖。有個年輕人，大概二十幾歲，在三個失蹤者失蹤前幾天，分別出現在他們附近。穿著像醫療人員——不是白袍，是那種深色制服，徽章位置有個東西，太小拍不清楚。他的行為不像普通過路人，他在等人。",
    priority: "minor",
    minAffinity: 70,
    requiredAct: 3,
  },

  // 莊河專屬：退休警察的名字在通話記錄
  {
    id: "zb_killer_zhuanghe",
    killerFilter: ["zhuanghe"],
    contentFn: () =>
      "陳瑤的通話紀錄裡有一個名字，通話時間是她失蹤前兩天。那通電話打了十二分鐘。我後來查了那個號碼——是個退休警察，霧港那邊的人，在刑警組待了二十幾年。退休警察，主動聯絡一個保險公司職員，講了十二分鐘。你覺得他們在聊什麼？",
    priority: "minor",
    minAffinity: 75,
    requiredAct: 3,
  },

  // 白秋專屬：藥局
  {
    id: "zb_killer_baiqiu",
    killerFilter: ["baiqiu"],
    contentFn: () =>
      "失蹤者最後幾次購藥記錄，有四個人用的是同一家藥局，就在這附近的街上。我去那家藥局問過，說是在做理賠調查。那個老闆娘讓我感到不對——她太快知道我想問什麼了，快到我還沒說清楚，她就給我標準答案了。備好答案的人才會那樣答話。",
    priority: "minor",
    minAffinity: 75,
    requiredAct: 3,
  },
];

// ── 公開函式 ─────────────────────────────────────────────────────

/** 根據 CaseConfig 為鄭博產生這局的動態線索清單 */
export function buildZhengboClues(config: CaseConfig): Clue[] {
  return ZHENGBO_CLUE_TEMPLATES
    .filter((t) => {
      if (t.killerFilter && !t.killerFilter.includes(config.killerId)) return false;
      if (t.motiveFilter && !t.motiveFilter.includes(config.motiveDirection)) return false;
      return true;
    })
    .map((t): Clue => ({
      id: t.id,
      content: t.contentFn(config),
      priority: t.priority,
      triggerCondition: {
        minAffinity: t.minAffinity,
        requiredAct: t.requiredAct,
        behaviorTrigger: t.behaviorTrigger,
        notBefore: t.notBefore,
      },
    }));
}
