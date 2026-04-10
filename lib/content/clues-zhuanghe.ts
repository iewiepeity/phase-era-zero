/**
 * 莊河動態線索模板
 *
 * 場景：霧港碼頭
 * 動機兼容：B（滅口者）
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

const ZHUANGHE_CLUE_TEMPLATES: ClueTemplate[] = [
  // 通用 critical：目擊者名單規律
  {
    id: "zh_pattern",
    contentFn: () =>
      "那個案子的目擊者名單，我記在腦子裡。名單上的人，這幾個月一個一個不見了。這不是巧合，這是有人在按照那份名單辦事。",
    priority: "critical",
    minAffinity: 35,
    requiredAct: 1,
    behaviorTrigger: "asked_about_the_missing",
  },
  // 通用 major：案件被移交
  {
    id: "zh_transfer",
    motiveFilter: ["B"],
    contentFn: () =>
      "那個案子被從上面移交走了。移交之前我看過完整的資料，移交之後——資料沒了，目擊者約談計劃停了，然後我被告知可以退休了。你說這是巧合嗎。",
    priority: "major",
    minAffinity: 55,
    requiredAct: 2,
    notBefore: ["zh_pattern"],
  },
  // B 動機 major：下命令的層級
  {
    id: "zh_authority_B",
    motiveFilter: ["B"],
    contentFn: () =>
      "移交命令是從分局長上面下來的。不是分局長，是分局長的上面。這個層級能動用的資源，不是普通案子能用到的。",
    priority: "major",
    minAffinity: 65,
    requiredAct: 2,
    notBefore: ["zh_transfer"],
  },
  // killerFilter：韓卓（B+韓卓）：現場法醫
  {
    id: "zh_medic_hanzhuo",
    killerFilter: ["hanzhuo"],
    contentFn: () =>
      "案發現場那晚，有個法醫助理在外圍等。他簽了一份協議以後走了。那份協議不是我們局的，是另一個機構的。那個機構的名字你要我說出來，我不說。",
    priority: "minor",
    minAffinity: 75,
    requiredAct: 3,
    notBefore: ["zh_authority_B"],
  },
  // killerFilter：莊河自己（B+莊河）：自我揭露
  {
    id: "zh_self_B",
    killerFilter: ["zhuanghe"],
    contentFn: () =>
      "那份名單裡，有些人知道的比別人多。知道得太多的人，在這個城市裡活得會比較辛苦。這句話你自己理解。",
    priority: "minor",
    minAffinity: 80,
    requiredAct: 3,
  },
  // A 動機 major：某人在報仇
  {
    id: "zh_revenge_A",
    motiveFilter: ["A"],
    contentFn: () =>
      "我在追查的時候注意到一件事：那些失蹤者，有幾個和同一個事故有關聯。不是直接關聯，是迂迴的。能把這條線梳出來的人，不是在查案，是在算帳。",
    priority: "major",
    minAffinity: 60,
    requiredAct: 2,
  },
  // C 動機 major：實驗殘留
  {
    id: "zh_experiment_C",
    motiveFilter: ["C"],
    contentFn: () =>
      "那個案子有一份附件，是醫療記錄。幾個目擊者在事發前都有同樣的診斷代碼，那個代碼不是常規的，你在普通醫院的系統裡查不到它。",
    priority: "major",
    minAffinity: 60,
    requiredAct: 2,
  },
];

export function buildZhuangheClues(config: CaseConfig): Clue[] {
  return ZHUANGHE_CLUE_TEMPLATES
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
