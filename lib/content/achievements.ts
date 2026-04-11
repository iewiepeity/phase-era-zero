/**
 * 成就系統定義
 *
 * 所有成就的 ID、名稱、條件說明、類型、隱藏狀態。
 * 觸發邏輯在 lib/services/achievements.ts，
 * 顯示在 /game/[sessionId]/achievements。
 */

export type AchievementCategory = "story" | "explore" | "collect" | "hidden" | "meta";

export interface AchievementDef {
  id:          string;
  name:        string;
  description: string;             // 玩家可見的描述
  category:    AchievementCategory;
  hidden:      boolean;            // true = 解鎖前只顯示「???」
  condition:   string;             // 開發者備注，不顯示給玩家
}

export const ACHIEVEMENTS: AchievementDef[] = [

  // ── 故事成就 (story) ─────────────────────────────────────────
  {
    id:          "first_accuse",
    name:        "第一次指控",
    description: "完成一次指控，不論對錯。",
    category:    "story",
    hidden:      false,
    condition:   "POST /api/game/accuse 呼叫成功",
  },
  {
    id:          "correct_killer",
    name:        "找到了",
    description: "正確指出真正的兇手。",
    category:    "story",
    hidden:      false,
    condition:   "AccuseResult.killerCorrect === true",
  },
  {
    id:          "perfect_accusation",
    name:        "相變世紀：Zero 通關",
    description: "兇手與動機全部猜對，滿分通關。",
    category:    "story",
    hidden:      false,
    condition:   "AccuseResult.score === 100",
  },
  {
    id:          "wrong_person",
    name:        "沉默的共犯",
    description: "指錯了人。真正的兇手繼續自由著。",
    category:    "story",
    hidden:      false,
    condition:   "AccuseResult.killerCorrect === false",
  },
  {
    id:          "killer_right_motive_wrong",
    name:        "看見了七成",
    description: "找到了兇手，但沒有理解他的動機。",
    category:    "story",
    hidden:      false,
    condition:   "killerCorrect && !motiveCorrect",
  },
  {
    id:          "motive_right_killer_wrong",
    name:        "理解了，但指錯了人",
    description: "動機方向正確，但兇手指錯了。",
    category:    "story",
    hidden:      false,
    condition:   "motiveCorrect && !killerCorrect",
  },
  {
    id:          "route_b_complete",
    name:        "另一種存在",
    description: "以第二相體身份完成一局遊戲。",
    category:    "story",
    hidden:      false,
    condition:   "playerIdentity === 'phase2' && game complete",
  },
  {
    id:          "route_b_win",
    name:        "獸性與理智",
    description: "以第二相體身份正確指出兇手。",
    category:    "story",
    hidden:      false,
    condition:   "playerIdentity === 'phase2' && killerCorrect",
  },

  // ── 探索成就 (explore) ───────────────────────────────────────
  {
    id:          "visit_all_scenes",
    name:        "中城區踏勘完畢",
    description: "造訪所有四個場景。",
    category:    "explore",
    hidden:      false,
    condition:   "4 scenes visited this session",
  },
  {
    id:          "talk_to_all_npcs",
    name:        "問遍了所有人",
    description: "在一局中與全部 9 位 NPC 對話過。",
    category:    "explore",
    hidden:      false,
    condition:   "chat history contains all 9 npcIds",
  },
  {
    id:          "trust_chen_jie",
    name:        "陳姐認可了你",
    description: "陳姐的信任度達到 60 以上。",
    category:    "explore",
    hidden:      false,
    condition:   "npcState.chen_jie.selfAffinity >= 60",
  },
  {
    id:          "trust_zhuanghe",
    name:        "老刑警點頭了",
    description: "莊河的信任度達到 60 以上。",
    category:    "explore",
    hidden:      false,
    condition:   "npcState.zhuanghe.selfAffinity >= 60",
  },
  {
    id:          "visit_ninth_precinct",
    name:        "進去就不一定能出來",
    description: "進入第九分局場景。",
    category:    "explore",
    hidden:      false,
    condition:   "visited scene ninth_precinct",
  },
  {
    id:          "visit_foggy_port",
    name:        "霧裡的東西",
    description: "進入霧港碼頭場景。",
    category:    "explore",
    hidden:      false,
    condition:   "visited scene foggy_port",
  },

  // ── 蒐集成就 (collect) ───────────────────────────────────────
  {
    id:          "first_clue",
    name:        "第一條線索",
    description: "從任意 NPC 取得第一條線索。",
    category:    "collect",
    hidden:      false,
    condition:   "revealedClueId != null for the first time",
  },
  {
    id:          "clues_5",
    name:        "拼圖開始成形",
    description: "蒐集到 5 條線索。",
    category:    "collect",
    hidden:      false,
    condition:   "total revealed clues >= 5",
  },
  {
    id:          "clues_15",
    name:        "線索夠多了",
    description: "蒐集到 15 條線索。",
    category:    "collect",
    hidden:      false,
    condition:   "total revealed clues >= 15",
  },
  {
    id:          "clues_from_3_npcs",
    name:        "多方消息來源",
    description: "從 3 位不同的 NPC 取得線索。",
    category:    "collect",
    hidden:      false,
    condition:   "distinct NPCs with revealed clues >= 3",
  },

  // ── 隱藏成就 (hidden) ────────────────────────────────────────
  {
    id:          "quick_solve",
    name:        "快速判斷",
    description: "在取得 3 條以下線索的情況下正確指出兇手。",
    category:    "hidden",
    hidden:      true,
    condition:   "total revealed clues <= 3 && killerCorrect",
  },
  {
    id:          "repeat_player",
    name:        "第幾個了",
    description: "開始第三局遊戲。",
    category:    "hidden",
    hidden:      true,
    condition:   "game count >= 3 for this guest",
  },
  {
    id:          "accuse_baiqiu",
    name:        "便當裡的秘密",
    description: "指控了白秋。",
    category:    "hidden",
    hidden:      true,
    condition:   "accused killer === 'baiqiu'",
  },
  {
    id:          "accuse_chen_jie",
    name:        "不可能是陳姐",
    description: "指控了陳姐。（陳姐是固定 NPC，不在兇手池中——但你還是指控了她。）",
    category:    "hidden",
    hidden:      true,
    condition:   "N/A — easter egg, manually trigger if selected",
  },
  {
    id:          "all_motives_tried",
    name:        "四個方向都試過了",
    description: "在不同的局中，四個動機方向都指控過至少一次。",
    category:    "hidden",
    hidden:      true,
    condition:   "accused motives A, B, C, D all tried across sessions",
  },

  // ── Meta 成就 ────────────────────────────────────────────────
  {
    id:          "hard_mode_win",
    name:        "賽德里斯的清醒者",
    description: "在「難」以上難度正確指出兇手。",
    category:    "meta",
    hidden:      false,
    condition:   "difficulty >= 'hard' && killerCorrect",
  },
  {
    id:          "nightmare_win",
    name:        "不可能的事已經發生了",
    description: "在「極難」模式正確指出兇手。",
    category:    "meta",
    hidden:      true,
    condition:   "difficulty === 'nightmare' && killerCorrect",
  },
];

/** 按類別分組 */
export const ACHIEVEMENTS_BY_CATEGORY = ACHIEVEMENTS.reduce<
  Record<AchievementCategory, AchievementDef[]>
>(
  (acc, a) => {
    acc[a.category].push(a);
    return acc;
  },
  { story: [], explore: [], collect: [], hidden: [], meta: [] },
);

/** 成就類別中文標籤 */
export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> = {
  story:   "故事",
  explore: "探索",
  collect: "蒐集",
  hidden:  "隱藏",
  meta:    "挑戰",
};

export const TOTAL_ACHIEVEMENTS = ACHIEVEMENTS.length;
