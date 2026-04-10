/**
 * 「它」動態線索模板
 *
 * 純文字模板，依本局 CaseConfig 過濾後產生 Clue[]。
 * 由 buildItClues() 呼叫，注入 app/api/chat/route.ts。
 *
 * 循環依賴說明：
 *   clues-it.ts → npc-registry.ts（Clue 型別）
 *   clues-it.ts → case-config.ts（KillerId / MotiveDirection / CaseConfig）
 *   random-engine.ts  → clues-it.ts（buildItClues）
 *   npc-registry.ts 不得 import clues-it.ts（會成環）
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

const IT_CLUE_TEMPLATES: ClueTemplate[] = [
  // 通用：它在找什麼
  {
    id: "it_search",
    contentFn: () =>
      "我在找一樣東西。那個東西在失蹤的其中一個人身上——是一個存放記憶記錄的容器，物理的，很小，可以放在口袋裡。那個人不在了。那樣東西在哪裡，我不知道。你如果見過不尋常的東西，告訴我。",
    priority: "critical",
    minAffinity: 25,
    requiredAct: 1,
    behaviorTrigger: "asked_what_it_wants",
  },

  // 通用：BTMA 也在找
  {
    id: "it_btma",
    contentFn: () =>
      "BTMA 的人在找同樣的東西。他們用的方法和我不一樣——他們的方法是把所有知道那件事的人移除。移除的意思是讓他們消失。你在調查這個案子，你要理解你現在在一個什麼位置。",
    priority: "major",
    minAffinity: 50,
    requiredAct: 2,
    notBefore: ["it_search"],
  },

  // 動機 C（實驗失敗品）：實驗沒有知情同意
  {
    id: "it_experiment_C",
    motiveFilter: ["C"],
    contentFn: () =>
      "那個實驗，不是所有參與者都知道自己在參加什麼。有一部分人，他們被告知的是健康研究，或者神經刺激測試，或者別的名字。但實際在做的事是——讓第二相體的覺醒在受控環境裡提前發生。沒有受控成功。這件事……它有後果，那些後果到現在還在展開。",
    priority: "major",
    minAffinity: 55,
    requiredAct: 2,
    notBefore: ["it_search"],
  },

  // 動機 C（實驗失敗品）：不穩定覺醒者的規律
  {
    id: "it_unstable_C",
    motiveFilter: ["C"],
    contentFn: () =>
      "覺醒不穩定的時候，那個人會在某些地點出現，不記得為什麼。是第二相體的感知殘留在拉動第一相體的身體移動。我知道這個規律。那些失蹤的地點，和那個規律……是一致的。那個人，在失蹤者失蹤的地點附近出現過，不是一次。",
    priority: "major",
    minAffinity: 70,
    requiredAct: 2,
  },

  // 陶生專屬（動機 C）：那個建築工人
  {
    id: "it_taosheng_C",
    killerFilter: ["taosheng"],
    contentFn: () =>
      "我見過他。他站在那個地點附近，站了很長時間，他不知道他自己在那裡——我說的不是比喻，他的意識不在那個身體裡，只有第二相體的感知殘留在控制他的位置。他的眼睛，有一段時間，不是他的眼睛。你懂我說的意思嗎。他不是故意的。但發生的事情還是發生了。",
    priority: "minor",
    minAffinity: 80,
    requiredAct: 3,
    notBefore: ["it_unstable_C"],
  },

  // 「它」自己是兇手（動機 C）：找東西的過程有事發生
  {
    id: "it_itself_C",
    killerFilter: ["it"],
    contentFn: () =>
      "那樣東西……我找到了一部分。但找的過程，有一些事情發生了。那些事情不是我讓它發生的——是它在我之外發生的，是第二相體的感知殘留在環境裡，和某些人的意識結構發生了接觸。接觸的結果……不穩定。我知道這個說法很難接受。但那不是我的意圖。",
    priority: "minor",
    minAffinity: 85,
    requiredAct: 4,
  },

  // 動機 D（扭曲崇拜）：那個符號
  {
    id: "it_ritual_D",
    motiveFilter: ["D"],
    contentFn: () =>
      "我見過那種符號。它出現在幾個地點，有人把它刻在那裡，或者畫在那裡。那個符號是林淵覺醒現場留下的一個圖形，是第二相體意識殘留在物理空間的刻印——只有在現場的人才能看到原版。現在有人在複製它，把它刻在那些失蹤地點附近。那個人不可能從公開資料知道那個符號。",
    priority: "major",
    minAffinity: 65,
    requiredAct: 2,
  },
];

// ── 公開函式 ─────────────────────────────────────────────────────

/** 根據 CaseConfig 為「它」產生這局的動態線索清單 */
export function buildItClues(config: CaseConfig): Clue[] {
  return IT_CLUE_TEMPLATES
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
