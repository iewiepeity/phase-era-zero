/**
 * 陶生動態線索模板
 *
 * 場景：霧港碼頭
 * 動機兼容：C（實驗失敗品）
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

const TAOSHENG_CLUE_TEMPLATES: ClueTemplate[] = [
  // 通用 critical：記憶空缺
  {
    id: "ts_memory_gap",
    contentFn: () =>
      "那晚我記得有股氣味，不是工地的氣味，不一樣，有點像燒金屬的味道但又不是。然後我記得我走過去看了一下，然後……後面的事我記不得了。我以為我只是累，但已經幾個月了，那段還是空的。",
    priority: "critical",
    minAffinity: 25,
    requiredAct: 1,
    behaviorTrigger: "asked_about_that_night",
  },
  // C 動機 major：無意識行為
  {
    id: "ts_blackout_C",
    motiveFilter: ["C"],
    contentFn: () =>
      "我後來算了一下，有幾個失蹤事件的時間，我的記憶都有問題，就是那種說不出來去了哪裡的空缺。不是每次都一樣長，有的是幾十分鐘，有的是大半個晚上。我沒有說謊，我真的不記得。",
    priority: "major",
    minAffinity: 50,
    requiredAct: 2,
    notBefore: ["ts_memory_gap"],
  },
  // C 動機 major：身體感知異常
  {
    id: "ts_sensation_C",
    motiveFilter: ["C"],
    contentFn: () =>
      "有幾次，睡醒以後我的手是熱的，熱得不正常，但我沒有發燒。工人說我那幾天眼神不對，我說哪裡不對，他說「就是不太對，師傅你可能太累了」。我也覺得是太累了，但現在我不確定了。",
    priority: "major",
    minAffinity: 65,
    requiredAct: 2,
    notBefore: ["ts_blackout_C"],
  },
  // killerFilter：陶生自己（C+陶生）
  {
    id: "ts_self_C",
    killerFilter: ["taosheng"],
    contentFn: () =>
      "有時候我醒來，我感覺自己去了某個地方，但我不知道那個地方在哪裡。不是夢，是那種確確實實去過的感覺，回來了但記不得路。如果那些失蹤的事……如果跟我有關係，我是不知情的，我不知道我做了什麼。",
    priority: "minor",
    minAffinity: 80,
    requiredAct: 3,
    notBefore: ["ts_sensation_C"],
  },
  // killerFilter：「它」（C+it）
  {
    id: "ts_entity_it",
    killerFilter: ["it"],
    contentFn: () =>
      "那晚工地外面，我記得有一個人站著。那個人站的方式不太對，不是普通人站著的方式，你說怎麼描述……就是太靜了，靜到像是一個物件放在那裡，不是一個人站在那裡。我走過去的時候那個人轉頭看我，然後我的記憶就斷掉了。",
    priority: "minor",
    minAffinity: 75,
    requiredAct: 3,
    notBefore: ["ts_blackout_C"],
  },
  // B 動機 major：有人在追蹤
  {
    id: "ts_watcher_B",
    motiveFilter: ["B"],
    contentFn: () =>
      "最近碼頭這邊有個人，不是工人，不是船員，就在附近轉。我問他幹嘛，他說在等人。他等了好幾天，等的那些時間剛好跟幾個熟面孔不見的時間對得上。",
    priority: "major",
    minAffinity: 55,
    requiredAct: 2,
  },
  // A 動機 major：舊事件痕跡
  {
    id: "ts_grudge_A",
    motiveFilter: ["A"],
    contentFn: () =>
      "碼頭這邊有個老倉庫，兩年前發生過一件事，我不知道細節，但那以後有幾個人就不在碼頭出現了。最近失蹤的人裡，我記得有幾個以前跟那件事的人有過節。這個我也是後來才想起來的。",
    priority: "major",
    minAffinity: 55,
    requiredAct: 2,
  },
];

export function buildTaoshengClues(config: CaseConfig): Clue[] {
  return TAOSHENG_CLUE_TEMPLATES
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
