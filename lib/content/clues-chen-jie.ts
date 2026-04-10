/**
 * 陳姐動態線索模板
 *
 * 純文字模板，依本局 CaseConfig 過濾後產生 Clue[]。
 * 由 buildChenJieClues() 呼叫，注入 app/api/chat/route.ts。
 *
 * 循環依賴說明：
 *   clues-chen-jie.ts → npc-registry.ts（Clue 型別）
 *   clues-chen-jie.ts → case-config.ts（KillerId / MotiveDirection / CaseConfig）
 *   random-engine.ts  → clues-chen-jie.ts（buildChenJieClues）
 *   npc-registry.ts 不得 import clues-chen-jie.ts（會成環）
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

const CHEN_JIE_CLUE_TEMPLATES: ClueTemplate[] = [
  // 通用線索：失蹤者走錯方向（適用所有組合）
  {
    id: "cj_direction",
    contentFn: () =>
      "那個失蹤的人上個月還在你這裡吃飯，吃完走的時候往反方向走了——那個方向沒有他家，也沒有他上班的地方。",
    priority: "critical",
    minAffinity: 30,
    requiredAct: 1,
    behaviorTrigger: "fed_full_meal_and_thanked",
  },
  // 動機方向 B（滅口者）：有人在等
  {
    id: "cj_watcher_B",
    motiveFilter: ["B"],
    contentFn: () =>
      "那個人走之前，有人在外面等他。等的人我沒看清臉，但那個人一出去，兩個人就往暗巷方向走。",
    priority: "major",
    minAffinity: 60,
    requiredAct: 2,
    notBefore: ["cj_direction"],
  },
  // 動機方向 A（倖存者清算）：失蹤者說過某句話
  {
    id: "cj_words_A",
    motiveFilter: ["A"],
    contentFn: () =>
      "他上次來的時候說了一句奇怪的話，說有人一直在「算帳」。我以為他在說債，後來想想不對。",
    priority: "major",
    minAffinity: 60,
    requiredAct: 2,
    notBefore: ["cj_direction"],
  },
  // 動機方向 C（實驗失敗品）：失蹤者眼神不對
  {
    id: "cj_eyes_C",
    motiveFilter: ["C"],
    contentFn: () =>
      "那個人最後幾次來，眼神不對。不是害怕，是那種……找什麼東西找到一半、快找到了、又怕找到的那種。",
    priority: "major",
    minAffinity: 60,
    requiredAct: 2,
    notBefore: ["cj_direction"],
  },
  // 動機方向 D（扭曲崇拜）：失蹤者拿過一張紙
  {
    id: "cj_paper_D",
    motiveFilter: ["D"],
    contentFn: () =>
      "失蹤前三天，他來吃飯，有人給他塞了一張紙。他看完臉色變了，但沒說什麼，就付錢走了。",
    priority: "major",
    minAffinity: 60,
    requiredAct: 2,
    notBefore: ["cj_direction"],
  },
  // 韓卓專屬：法醫制服
  {
    id: "cj_medical_hanzhuo",
    killerFilter: ["hanzhuo"],
    contentFn: (cfg) =>
      `你後來想起來，那個在外面等的人穿著很整齊，像是什麼制服，但不是警察。（兇手：${cfg.killerId}，僅供除錯）`,
    priority: "minor",
    minAffinity: 80,
    requiredAct: 3,
    notBefore: ["cj_watcher_B"],
  },
  // 莊河專屬：認出是警察
  {
    id: "cj_cop_zhuanghe",
    killerFilter: ["zhuanghe"],
    contentFn: () =>
      "等的那個人……我後來才想起來，他以前也來過這裡。警察，退休的那種，舉止你認得出來。",
    priority: "minor",
    minAffinity: 80,
    requiredAct: 3,
    notBefore: ["cj_watcher_B"],
  },
];

// ── 公開函式 ─────────────────────────────────────────────────────

/** 根據 CaseConfig 為陳姐產生這局的動態線索清單 */
export function buildChenJieClues(config: CaseConfig): Clue[] {
  return CHEN_JIE_CLUE_TEMPLATES
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
