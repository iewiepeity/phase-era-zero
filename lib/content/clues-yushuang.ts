/**
 * 余霜動態線索模板
 *
 * 純文字模板，依本局 CaseConfig 過濾後產生 Clue[]。
 * 由 buildYushuangClues() 呼叫，注入 app/api/chat/route.ts。
 *
 * 余霜任職聖文醫院兒科，了解林淵的療養期間、訪客名單，
 * 以及失蹤者與醫院的關係。她的線索通過護士語氣傳達扭曲信仰。
 *
 * 循環依賴說明：
 *   clues-yushuang.ts → npc-registry.ts（Clue 型別）
 *   clues-yushuang.ts → case-config.ts（KillerId / MotiveDirection / CaseConfig）
 *   random-engine.ts  → clues-yushuang.ts（buildYushuangClues）
 *   npc-registry.ts 不得 import clues-yushuang.ts（會成環）
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

const YUSHUANG_CLUE_TEMPLATES: ClueTemplate[] = [
  // 通用線索：林淵的訪客名單與失蹤者重疊
  {
    id: "ys_patient",
    contentFn: () =>
      "林先生在我們這裡療養過一段時間。那段時間……他有一些訪客，頻率很高。有些訪客，後來我在別的地方看到了他們的名字。",
    priority: "critical",
    minAffinity: 30,
    requiredAct: 1,
    behaviorTrigger: "asked_about_the_missing",
  },
  // 動機方向 D（扭曲崇拜）：「不配」見證的概念初現
  {
    id: "ys_worthy",
    motiveFilter: ["D"],
    contentFn: () =>
      "你有沒有想過……有些人，他們在某個時刻，是不應該出現在那裡的？不是說他們不好，是他們的存在，會讓某件事……變得不純粹。就像手術室裡，你不會讓閒雜人等進來的。",
    priority: "major",
    minAffinity: 60,
    requiredAct: 2,
    notBefore: ["ys_patient"],
  },
  // 動機方向 D（扭曲崇拜）：她目擊了林淵的覺醒
  {
    id: "ys_ritual_D",
    motiveFilter: ["D"],
    contentFn: () =>
      "林先生覺醒那晚，我值班。我看見了。那個……那個畫面，不是任何人都應該看見的。有些人看見了，他們後來……他們沒辦法繼續正常生活的。那不是他們的問題，是他們不應該在那裡。",
    priority: "major",
    minAffinity: 70,
    requiredAct: 3,
    notBefore: ["ys_worthy"],
  },
  // 兇手林知夏專屬：那個學生問了不像論文需要的問題
  {
    id: "ys_linzhixia",
    killerFilter: ["linzhixia"],
    contentFn: () =>
      "有個學生，常來問關於相體覺醒的問題。問的角度非常精準，不像是一般的學術興趣。她說她在寫論文，但她問的問題……論文不需要知道那些。她問的是——覺醒者在覺醒後的第一個小時，意識的歸屬在哪裡。",
    priority: "minor",
    minAffinity: 80,
    requiredAct: 3,
    notBefore: ["ys_ritual_D"],
  },
  // 兇手余霜專屬（余霜是兇手時）：她做了「護理決定」
  {
    id: "ys_yushuang_D",
    killerFilter: ["yushuang"],
    contentFn: () =>
      "林先生的訪客名單，我沒有上報所有的。有些訪客……我評估了一下，他們來，對林先生的療養不好。我做了一些……護理上的決定。讓他們沒有辦法再來。",
    priority: "minor",
    minAffinity: 85,
    requiredAct: 4,
  },
  // 動機方向 B（滅口者）：失蹤者的醫院紀錄被非正式調閱
  {
    id: "ys_schedule_B",
    motiveFilter: ["B"],
    contentFn: () =>
      "那些失蹤者裡，有幾個人是在同一個時間段進出我們醫院的。我不確定他們是不是有聯繫，但他們的紀錄……被人調閱過，不是正式程序。我查到調閱紀錄的時候，那個操作者的帳號已經被刪除了。",
    priority: "major",
    minAffinity: 65,
    requiredAct: 2,
  },
  // 動機方向 A（倖存者清算）：失蹤者中有人曾試圖找到某個舊案
  {
    id: "ys_history_A",
    motiveFilter: ["A"],
    contentFn: () =>
      "有一個失蹤的人，他在林先生療養的時候來過兩次。兩次都說自己是「舊識」。但林先生說不認識他。那個人每次來，都帶著一個舊的資料夾，封面上我看到了一個日期——比 P.E. 元年還要早好幾年。",
    priority: "major",
    minAffinity: 60,
    requiredAct: 2,
    notBefore: ["ys_patient"],
  },
  // 動機方向 C（實驗失敗品）：失蹤者的身體狀況有異常記錄
  {
    id: "ys_unstable_C",
    motiveFilter: ["C"],
    contentFn: () =>
      "有幾個失蹤者……他們來過我們的急診，但不是一般的傷。是那種——生命跡象正常，但神經反應對不上。就像有什麼東西在他們的身體裡安靜地壞掉了，但外面看不出來。我見過這種，但只在覺醒相關的案例裡見過。",
    priority: "major",
    minAffinity: 70,
    requiredAct: 3,
    notBefore: ["ys_patient"],
  },
];

// ── 公開函式 ─────────────────────────────────────────────────────

/** 根據 CaseConfig 為余霜產生這局的動態線索清單 */
export function buildYushuangClues(config: CaseConfig): Clue[] {
  return YUSHUANG_CLUE_TEMPLATES
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
