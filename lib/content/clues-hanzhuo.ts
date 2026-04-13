/**
 * 韓卓動態線索模板
 *
 * 純文字模板，依本局 CaseConfig 過濾後產生 Clue[]。
 * 由 buildHanzhuoClues() 呼叫，注入 app/api/chat/route.ts。
 *
 * 韓卓任職市立太平間，是 14 號失蹤案現場的外部目擊者。
 * 他的線索涉及：現場物理證據、第二相體覺醒殘留、施壓者身份。
 *
 * 循環依賴說明：
 *   clues-hanzhuo.ts → npc-registry.ts（Clue 型別）
 *   clues-hanzhuo.ts → case-config.ts（KillerId / MotiveDirection / CaseConfig）
 *   random-engine.ts  → clues-hanzhuo.ts（buildHanzhuoClues）
 *   npc-registry.ts 不得 import clues-hanzhuo.ts（會成環）
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

const HANZHUO_CLUE_TEMPLATES: ClueTemplate[] = [
  // 通用線索：現場灼痕——第二相體覺醒的物理殘留
  {
    id: "hz_scene",
    contentFn: () =>
      "現場的灼痕……不是普通火源。那個形狀，是某種能量集中爆發留下的。做法醫這幾年，我只在相變事故報告裡見過。",
    priority: "critical",
    minAffinity: 35,
    requiredAct: 1,
    behaviorTrigger: "showed_concern_for_him",
  },
  // 通用線索：保密協議的抬頭不是警察局
  {
    id: "hz_nda",
    contentFn: () =>
      "我簽了一份協議。他們說這是「案件保密需要」。但那份協議的抬頭……不是警察局。",
    priority: "major",
    minAffinity: 55,
    requiredAct: 2,
    notBefore: ["hz_scene"],
  },
  // 動機方向 B（滅口者）：警戒線外有人在「確認」
  {
    id: "hz_visitor_B",
    motiveFilter: ["B"],
    contentFn: () =>
      "那晚有人在現場周圍，在警戒線外。我看到他了。他站在那裡，像是在確認什麼。不是來看熱鬧的，也不是記者——記者會移動，他沒有。",
    priority: "major",
    minAffinity: 65,
    requiredAct: 2,
    notBefore: ["hz_nda"],
  },
  // 兇手莊河專屬：那個人的站姿是刑警的站姿
  {
    id: "hz_cop_zhuanghe",
    killerFilter: ["zhuanghe"],
    contentFn: () =>
      "那個人站的姿勢……跟目擊者不一樣。我見過很多刑警，他們看現場的眼神跟旁觀者不同。那個人，是在管理現場。不是在觀察，是在確認沒有問題。",
    priority: "minor",
    minAffinity: 80,
    requiredAct: 3,
    notBefore: ["hz_visitor_B"],
  },
  // 兇手韓卓專屬（韓卓是兇手時）：他後來才查到協議的真正意義
  {
    id: "hz_order_hanzhuo",
    killerFilter: ["hanzhuo"],
    contentFn: () =>
      "那份協議……我後來查過抬頭。是 BTMA 的。他們在保護的，是現場的某個訊息，不是人。我不知道那個訊息是什麼。或者說——我知道，但我不想知道我知道。",
    priority: "minor",
    minAffinity: 80,
    requiredAct: 3,
  },
  // 動機方向 C（實驗失敗品）：灼痕圖案跟實驗案例相符
  {
    id: "hz_research_C",
    motiveFilter: ["C"],
    contentFn: () =>
      "灼痕的形狀，我後來畫下來了。那個圖案……跟 BTMA 某個實驗案例的報告裡，有一張圖一樣。我不應該看到那份報告的。那份報告的標題我記得：『覺醒不穩定個體能量殘留標準圖譜——第七修訂版』。",
    priority: "major",
    minAffinity: 70,
    requiredAct: 3,
    notBefore: ["hz_scene"],
  },
  // 動機方向 A（倖存者清算）：失蹤者之間有某種隱形的聯繫
  {
    id: "hz_pattern_A",
    motiveFilter: ["A"],
    contentFn: () =>
      "我比對過幾個失蹤者的案件紀錄。他們沒有明顯的共同點，但有一件事——他們都在大概同一段時間，出入過同一棟建築物。那棟樓現在是空的，但登記資料裡它不是空的。",
    priority: "major",
    minAffinity: 65,
    requiredAct: 2,
    notBefore: ["hz_nda"],
  },
  // 動機方向 D（扭曲崇拜）：現場有一個無法解釋的符號
  {
    id: "hz_symbol_D",
    motiveFilter: ["D"],
    contentFn: () =>
      "現場有一個東西我沒有寫在報告裡。灼痕的中心，有個符號，燒進地板裡。不是偶然形成的，那個線條太對稱了。我把它拍下來，但那張照片我沒有上傳，在我自己的手機裡。",
    priority: "major",
    minAffinity: 75,
    requiredAct: 3,
    notBefore: ["hz_scene"],
  },

  // 通用：通話記錄有技術異常——暗示偽造（韓卓注意到程序問題）
  {
    id: "hz_call_record_anomaly",
    contentFn: () =>
      "那份通話記錄……我看過文件格式。這是我多管閒事，不在我職責範圍內，但我認識的一個人做過電信業，他說過正規的通話記錄有幾個固定欄位，包括中繼站 ID 和封包確認碼。那份起訴書裡的摘要版本——那些欄位不在，只有時間和號碼。那個格式不是標準格式。我說的不是這些，我說的是，如果有人要偽造一份通話記錄，那種格式是最容易偽造的。",
    priority: "major",
    minAffinity: 65,
    requiredAct: 3,
    notBefore: ["hz_nda"],
  },
];

// ── 公開函式 ─────────────────────────────────────────────────────

/** 根據 CaseConfig 為韓卓產生這局的動態線索清單 */
export function buildHanzhuoClues(config: CaseConfig): Clue[] {
  return HANZHUO_CLUE_TEMPLATES
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
