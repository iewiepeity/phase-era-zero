/**
 * 白秋動態線索模板
 *
 * 純文字模板，依本局 CaseConfig 過濾後產生 Clue[]。
 * 由 buildBaiqiuClues() 呼叫，注入 app/api/chat/route.ts。
 *
 * 循環依賴說明：
 *   clues-baiqiu.ts → npc-registry.ts（Clue 型別）
 *   clues-baiqiu.ts → case-config.ts（KillerId / MotiveDirection / CaseConfig）
 *   random-engine.ts  → clues-baiqiu.ts（buildBaiqiuClues）
 *   npc-registry.ts 不得 import clues-baiqiu.ts（會成環）
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

const BAIQIU_CLUE_TEMPLATES: ClueTemplate[] = [
  // 通用線索：失蹤者購藥記錄
  {
    id: "bq_purchase",
    contentFn: () =>
      "那些失蹤的人，裡面有幾個是我的顧客。他們最後一次來，都買了同一類藥。一種會讓感知降低的藥——正式名稱是感知抑制劑，有幾種，作用都差不多，讓神經反應速度下降，讓人不容易察覺到環境變化。有人告訴他們要買這個。",
    priority: "critical",
    minAffinity: 35,
    requiredAct: 1,
    behaviorTrigger: "mentioned_the_missing",
  },

  // 通用：藥局進貨被追蹤
  {
    id: "bq_supplier",
    contentFn: () =>
      "進藥的那個通路，有人在追蹤我的訂單。不是稅務，稅務是另一種方式，我分得出來。這個追蹤方式——是在看我買了什麼、賣給了誰、多少數量、什麼頻率。他們在建一個圖，我是圖上的一個節點。",
    priority: "major",
    minAffinity: 50,
    requiredAct: 2,
  },

  // 動機 A（倖存者清算）：弟弟和研究計劃
  {
    id: "bq_brother_A",
    motiveFilter: ["A"],
    contentFn: () =>
      "我弟弟失蹤前參加了一個計劃。那個計劃的名字他說過，我記得，我不說出來，你不需要知道。計劃的組織者，後來也在失蹤名單上。不是我做的——我只是知道他們是誰，我只是知道他們在那個計劃裡做了什麼。白鳴在失蹤前說有一段記憶他不記得了。整整兩個星期。",
    priority: "major",
    minAffinity: 60,
    requiredAct: 2,
  },

  // 動機 B（滅口者）：有人找過她
  {
    id: "bq_order_B",
    motiveFilter: ["B"],
    contentFn: () =>
      "有人找過我。說只要我配合一件事，我弟弟就沒事。我問他弟弟現在在哪裡。他沒答。他說的那件事是讓我調整幾份藥品的記錄，讓幾個顧客的購藥劑量看起來是他們自己要求的。我知道那些藥在那個劑量下是什麼效果。",
    priority: "major",
    minAffinity: 60,
    requiredAct: 2,
  },

  // 動機 C（實驗失敗品）：記憶空缺
  {
    id: "bq_research_C",
    motiveFilter: ["C"],
    contentFn: () =>
      "那個研究計劃的參與者，他們後來都有一個共同點：某段時間的記憶空缺。不是失憶症，是那段時間他們做了什麼，他們不記得，但身體有反應——有些人說那段時間身體不像自己的。我弟弟說過這件事。說完就不見了。",
    priority: "major",
    minAffinity: 65,
    requiredAct: 2,
    notBefore: ["bq_purchase"],
  },

  // 鄭博專屬：那個問保險的男人
  {
    id: "bq_killer_zhengbo",
    killerFilter: ["zhengbo"],
    contentFn: () =>
      "有個男人來過我藥局，說在做保險理賠調查。問了很多問題，藥品記錄、顧客名單、進貨頻率。他問的方式讓我知道他不只是在調查理賠——他在找一份人名列表。那份列表上的人，是某件事的共同參與者。他知道那件事。",
    priority: "minor",
    minAffinity: 75,
    requiredAct: 3,
  },

  // 余霜專屬：那個護士的購藥記錄
  {
    id: "bq_killer_yushuang",
    killerFilter: ["yushuang"],
    contentFn: () =>
      "有個護士，她是我的顧客。她的購藥記錄我注意到了——某幾種藥，她買的劑量和頻率，在醫院的臨床環境裡是合理的，但她不是在醫院環境裡用。在外面用是另一種效果。她很清楚她在買什麼，她每次問的都很精準，沒有多問一個字。",
    priority: "minor",
    minAffinity: 75,
    requiredAct: 3,
  },
];

// ── 公開函式 ─────────────────────────────────────────────────────

/** 根據 CaseConfig 為白秋產生這局的動態線索清單 */
export function buildBaiqiuClues(config: CaseConfig): Clue[] {
  return BAIQIU_CLUE_TEMPLATES
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
