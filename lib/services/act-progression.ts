/**
 * 幕次自動推進服務
 *
 * 第 1 幕 → 第 2 幕 觸發條件（任一即可）：
 *   - 收集到 3+ critical 線索（以 player_clues 總數近似）
 *   - 已與 5+ 位不同 NPC 對話
 *
 * 推進時解鎖 BTMA 大廳場景。
 * 前端把 newAct 存入 localStorage `pez_act_${sessionId}`。
 */

export interface ActProgressionResult {
  /** 本次是否觸發推進 */
  advanced:        boolean;
  /** 推進後的幕次（若未推進則等於 currentAct） */
  newAct:          number;
  /** 觸發原因 */
  reason?:         "critical_clues" | "npc_conversations";
  /** 本次解鎖的場景 ID 列表 */
  unlockedScenes?: string[];
}

/**
 * 根據目前遊戲狀態判斷是否應推進幕次。
 *
 * @param currentAct       - 目前幕次（1–10）
 * @param criticalClueCount - 玩家已收集的線索數量（critical 優先，此處用總數近似）
 * @param talkedNpcCount   - 已對話過的不同 NPC 數量
 */
export function checkActProgression(
  currentAct:        number,
  criticalClueCount: number,
  talkedNpcCount:    number,
): ActProgressionResult {
  // 目前只有 1→2 的推進邏輯；幕次 ≥2 直接跳過
  if (currentAct >= 2) {
    return { advanced: false, newAct: currentAct };
  }

  if (criticalClueCount >= 3) {
    return {
      advanced:       true,
      newAct:         2,
      reason:         "critical_clues",
      unlockedScenes: ["btma_lobby"],
    };
  }

  if (talkedNpcCount >= 5) {
    return {
      advanced:       true,
      newAct:         2,
      reason:         "npc_conversations",
      unlockedScenes: ["btma_lobby"],
    };
  }

  return { advanced: false, newAct: currentAct };
}
