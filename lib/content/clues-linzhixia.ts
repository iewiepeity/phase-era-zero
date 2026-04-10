/**
 * 林知夏動態線索模板
 *
 * 場景：案發現場
 * 動機兼容：D（扭曲崇拜）
 */

import type { Clue } from "../npc-registry";
import type { KillerId, MotiveDirection, CaseConfig } from "../case-config";

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

const LINZHIXIA_CLUE_TEMPLATES: ClueTemplate[] = [
  // 通用 critical：現場符號記錄
  {
    id: "lzx_symbol",
    contentFn: () =>
      "現場有一個符號，刻在地面的凹陷裡，不是刀刻的，是某種熱源燒出來的。那個符號我查過，它出現在一個關於相體覺醒儀式的邊緣文獻裡，那篇文獻的作者不是學術人員。",
    priority: "critical",
    minAffinity: 30,
    requiredAct: 1,
    behaviorTrigger: "showed_academic_interest",
  },
  // D 動機 major：儀式邏輯
  {
    id: "lzx_ritual_D",
    motiveFilter: ["D"],
    contentFn: () =>
      "那個符號出現的位置，和林淵覺醒那晚的地點有一個幾何關係。如果你把兩個點連起來，延長線指向另一個失蹤地點。這不是隨機的。這是有人在複製那晚的空間結構。",
    priority: "major",
    minAffinity: 55,
    requiredAct: 2,
    notBefore: ["lzx_symbol"],
  },
  // D 動機 major：崇拜者的細節
  {
    id: "lzx_devotee_D",
    motiveFilter: ["D"],
    contentFn: () =>
      "做這件事的人，對那晚的細節知道得太清楚了。不是從公開報導可以知道的那種程度。他們知道林淵站在哪裡，知道覺醒發生的方向，知道現場的聲音是什麼。這個人要不是那晚在場，就是從在場的人那裡拿到了第一手資訊。",
    priority: "major",
    minAffinity: 65,
    requiredAct: 3,
    notBefore: ["lzx_ritual_D"],
  },
  // killerFilter：余霜
  {
    id: "lzx_yushuang_D",
    killerFilter: ["yushuang"],
    contentFn: () =>
      "我在整理林淵療養期間的訪客記錄的時候，有一個名字出現頻率很高，比任何其他訪客都高。那個人不是家屬，不是主治醫師，是一個護士，兒科的護士。你說這合理嗎，兒科護士為什麼要這麼頻繁地探訪一個相體覺醒患者。",
    priority: "minor",
    minAffinity: 75,
    requiredAct: 3,
    notBefore: ["lzx_devotee_D"],
  },
  // killerFilter：林知夏自己
  {
    id: "lzx_self_D",
    killerFilter: ["linzhixia"],
    contentFn: () =>
      "我的論文有一章是關於「見證資格」的，我的定義是：只有理解那一刻意義的人，才算真正見證了那一刻。其他的人……只是在場而已。在場，和見證，不是同一件事。",
    priority: "minor",
    minAffinity: 80,
    requiredAct: 4,
  },
  // B 動機 major：封口跡象
  {
    id: "lzx_silence_B",
    motiveFilter: ["B"],
    contentFn: () =>
      "我在整理目擊者資料的時候發現，幾個人在失蹤之前都刪除了某個時期的社群媒體記錄，刪除的時間段是同一個事件之後的三個月。這個一致性不是偶然的，有人教他們這樣做，或者有人替他們做了。",
    priority: "major",
    minAffinity: 60,
    requiredAct: 2,
  },
  // C 動機 major：實驗參與者
  {
    id: "lzx_experiment_C",
    motiveFilter: ["C"],
    contentFn: () =>
      "失蹤者裡有幾個有一個共同點，我是在整理背景資料的時候發現的：他們都參加過一個叫做「Phase Integration Study」的研究，在賽德里斯醫學院的一個子計劃下面。那個計劃現在查不到了，資料被撤了。",
    priority: "major",
    minAffinity: 60,
    requiredAct: 2,
  },
];

export function buildLinzhixiaClues(config: CaseConfig): Clue[] {
  return LINZHIXIA_CLUE_TEMPLATES
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
