/**
 * 成就解鎖服務
 *
 * checkAndUnlockAchievements() 在各 API 觸發點呼叫，
 * 回傳本次新解鎖的成就列表。
 * 前端把 ID 列表存進 localStorage（STORAGE_KEYS.ACHIEVEMENTS）。
 */

import { ACHIEVEMENTS } from "@/lib/content/achievements";
import type { AchievementDef } from "@/lib/content/achievements";

export interface AchievementContext {
  /** 指控相關（accuse route 觸發） */
  killerCorrect?:    boolean;
  motiveCorrect?:    boolean;
  subMotiveCorrect?: boolean;
  score?:            number;
  accusedKillerId?:  string;
  playerIdentity?:   "normal" | "phase2";
  difficulty?:       string;

  /** 進度相關（chat / scene interactions 觸發） */
  clueCount?:        number;   // 玩家總線索數
  talkedNpcCount?:   number;   // 已對話 NPC 數
  clueNpcCount?:     number;   // 有揭露線索的不同 NPC 數
  visitedSceneIds?:  string[];

  /** NPC 信任度（chat route 觸發，僅特定成就使用） */
  npcTrustMap?:      Record<string, number>;
}

/**
 * 根據當前情境，回傳應新解鎖的成就列表。
 *
 * @param ctx            - 當前遊戲情境數值
 * @param alreadyUnlocked - 已解鎖的成就 ID 列表（避免重複）
 */
export function checkAndUnlockAchievements(
  ctx:              AchievementContext,
  alreadyUnlocked:  string[],
): AchievementDef[] {
  return ACHIEVEMENTS.filter(
    (a) => !alreadyUnlocked.includes(a.id) && shouldUnlock(a, ctx),
  );
}

function shouldUnlock(a: AchievementDef, ctx: AchievementContext): boolean {
  switch (a.id) {

    // ── 故事成就 ────────────────────────────────────────────────
    case "first_accuse":
      return ctx.killerCorrect !== undefined;
    case "correct_killer":
      return ctx.killerCorrect === true;
    case "perfect_accusation":
      return ctx.score === 100;
    case "wrong_person":
      return ctx.killerCorrect === false;
    case "killer_right_motive_wrong":
      return ctx.killerCorrect === true && ctx.motiveCorrect === false;
    case "motive_right_killer_wrong":
      return ctx.motiveCorrect === true && ctx.killerCorrect === false;
    case "route_b_complete":
      return ctx.playerIdentity === "phase2" && ctx.killerCorrect !== undefined;
    case "route_b_win":
      return ctx.playerIdentity === "phase2" && ctx.killerCorrect === true;

    // ── 探索成就 ────────────────────────────────────────────────
    case "visit_all_scenes":
      return (ctx.visitedSceneIds?.length ?? 0) >= 10;
    case "talk_to_all_npcs":
      return (ctx.talkedNpcCount ?? 0) >= 9;
    case "trust_chen_jie":
      return (ctx.npcTrustMap?.["chen_jie"] ?? 0) >= 60;
    case "trust_zhuanghe":
      return (ctx.npcTrustMap?.["zhuanghe"] ?? 0) >= 60;
    case "visit_ninth_precinct":
      return ctx.visitedSceneIds?.includes("ninth_precinct") ?? false;
    case "visit_foggy_port":
      return ctx.visitedSceneIds?.includes("foggy_port") ?? false;

    // ── 蒐集成就 ────────────────────────────────────────────────
    case "first_clue":
      return (ctx.clueCount ?? 0) >= 1;
    case "clues_5":
      return (ctx.clueCount ?? 0) >= 5;
    case "clues_15":
      return (ctx.clueCount ?? 0) >= 15;
    case "clues_from_3_npcs":
      return (ctx.clueNpcCount ?? 0) >= 3;

    // ── 隱藏成就 ────────────────────────────────────────────────
    case "quick_solve":
      return ctx.killerCorrect === true && (ctx.clueCount ?? 99) <= 3;
    case "accuse_baiqiu":
      return ctx.accusedKillerId === "baiqiu";
    case "accuse_chen_jie":
      return ctx.accusedKillerId === "chen_jie";

    // ── Meta 成就 ───────────────────────────────────────────────
    case "hard_mode_win":
      return ctx.difficulty === "hard" && ctx.killerCorrect === true;

    // 其餘（repeat_player、all_motives_tried、nightmare_win）需跨局統計，暫不觸發
    default:
      return false;
  }
}
