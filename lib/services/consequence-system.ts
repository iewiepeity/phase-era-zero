/**
 * 不可逆選擇後果系統
 *
 * 追蹤玩家做出的重大、不可撤回選擇，並在後續對話或場景中施加對應後果。
 *
 * 目前支援的後果種類：
 *   - wrong_accuse_npc    : 錯誤指控某 NPC 為兇手 → 該 NPC 拒絕繼續對話
 *   - revealed_phase2     : 向敵對 NPC 透露第二相體身份 → 部分 NPC 態度轉變
 *   - bribed_witness      : 賄賂證人 → 輿論值下降
 *   - destroyed_evidence  : 銷毀證據 → 無法再取得該線索
 */

import { STORAGE_KEYS } from "@/lib/constants";

// ── 型別定義 ──────────────────────────────────────────────────

export type ConsequenceKind =
  | "wrong_accuse_npc"
  | "revealed_phase2"
  | "bribed_witness"
  | "destroyed_evidence";

export interface Consequence {
  kind:      ConsequenceKind;
  targetId:  string;          // NPC ID 或線索 ID
  timestamp: number;          // Unix ms
  actWhen:   number;          // 觸發時的幕次
}

// ── 讀寫 localStorage ────────────────────────────────────────

function readConsequences(sessionId: string): Consequence[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONSEQUENCES(sessionId));
    if (!raw) return [];
    return JSON.parse(raw) as Consequence[];
  } catch {
    return [];
  }
}

function writeConsequences(sessionId: string, data: Consequence[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONSEQUENCES(sessionId), JSON.stringify(data));
  } catch { /* ignore */ }
}

// ── 公開 API ─────────────────────────────────────────────────

/**
 * 記錄一個不可逆後果。
 * 若同一 kind + targetId 已存在，不重複寫入。
 */
export function recordConsequence(
  sessionId:  string,
  kind:       ConsequenceKind,
  targetId:   string,
  currentAct: number,
): void {
  try {
    const data = readConsequences(sessionId);
    const alreadyExists = data.some(
      (c) => c.kind === kind && c.targetId === targetId,
    );
    if (alreadyExists) return;

    data.push({
      kind,
      targetId,
      timestamp: Date.now(),
      actWhen:   currentAct,
    });
    writeConsequences(sessionId, data);
  } catch { /* ignore */ }
}

/**
 * 查詢某後果是否已發生。
 */
export function hasConsequence(
  sessionId: string,
  kind:      ConsequenceKind,
  targetId:  string,
): boolean {
  try {
    return readConsequences(sessionId).some(
      (c) => c.kind === kind && c.targetId === targetId,
    );
  } catch {
    return false;
  }
}

/**
 * 取得特定類型的所有後果（例如取得所有被錯誤指控的 NPC）。
 */
export function getConsequencesByKind(
  sessionId: string,
  kind:      ConsequenceKind,
): Consequence[] {
  try {
    return readConsequences(sessionId).filter((c) => c.kind === kind);
  } catch {
    return [];
  }
}

/**
 * 取得某 NPC 是否因錯誤指控而拒絕對話。
 * 若是，回傳拒絕對話的提示文字（用於對話頁面顯示）。
 */
export function getRefusalMessage(sessionId: string, npcId: string): string | null {
  if (!hasConsequence(sessionId, "wrong_accuse_npc", npcId)) return null;
  return "（對方沉默著，不想再和你說話。你說過的那些話，已經回不去了。）";
}

/**
 * 產生注入 System Prompt 的「後果」文字區塊。
 * 若無相關後果則回傳空字串。
 */
export function getConsequencePromptBlock(sessionId: string, npcId: string): string {
  const lines: string[] = [];

  if (hasConsequence(sessionId, "wrong_accuse_npc", npcId)) {
    lines.push(
      "玩家曾正式指控你是造成連環失蹤案的兇手，但後來被證明是錯誤的。" +
      "你對此感到憤慨和受傷。你不想再和他說話，但你還是在場——你可以簡短回應，" +
      "但態度是冷漠的、受傷的，不願深談。",
    );
  }

  if (hasConsequence(sessionId, "revealed_phase2", npcId)) {
    lines.push(
      "玩家曾向你透露自己是第二相體。這個資訊讓你的態度產生了某種變化——" +
      "視你的性格，這可能讓你更警戒，或更願意信任，但你無法假裝沒聽到。",
    );
  }

  if (lines.length === 0) return "";
  return `\n【不可逆的事已經發生】\n${lines.join("\n")}`;
}

/**
 * 清除特定 session 的所有後果記錄（通常在重新開始時呼叫）。
 */
export function clearConsequences(sessionId: string): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CONSEQUENCES(sessionId));
  } catch { /* ignore */ }
}
