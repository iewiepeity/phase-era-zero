/**
 * NPC 互動態度追蹤
 *
 * 在每次玩家傳送訊息後，分析訊息語氣，累積到 localStorage。
 * 在下一次對話 buildNpcPrompt 時，注入為「互動記錄」提示。
 */

import { STORAGE_KEYS } from "@/lib/constants";

// ── 態度累計資料結構 ───────────────────────────────────────────

interface AttitudeData {
  /** 攻擊/威脅性語氣的次數 */
  hostileCount:   number;
  /** 友善/合作性語氣的次數 */
  friendlyCount:  number;
  /** 曾直接指控此 NPC 是兇手 */
  accusedKiller:  boolean;
  /** 曾向此 NPC 透露自己可能是第二相體 */
  revealedPhase2: boolean;
  /** 最後更新的幕次 */
  lastAct:        number;
}

const DEFAULT_ATTITUDE: AttitudeData = {
  hostileCount:   0,
  friendlyCount:  0,
  accusedKiller:  false,
  revealedPhase2: false,
  lastAct:        0,
};

// ── 關鍵字偵測 ─────────────────────────────────────────────────

const HOSTILE_KEYWORDS  = ["你殺了", "你就是兇手", "我知道是你", "你在說謊", "你騙我", "別讓我", "你最好", "我警告你", "小心點", "後果自負", "你根本不知道", "廢話", "滾", "你不敢"];
const FRIENDLY_KEYWORDS = ["謝謝你", "謝謝", "辛苦了", "感謝", "我相信你", "我信任你", "你說得對", "你幫了我", "我理解", "你沒問題"];
const ACCUSE_KEYWORDS   = ["你就是兇手", "你殺了那", "就是你做的", "是你造成的"];
const PHASE2_KEYWORDS   = ["我是第二相體", "我也是相體", "我覺醒了", "我有第二相體的能力"];

function detectHostile(text: string): boolean {
  return HOSTILE_KEYWORDS.some((kw) => text.includes(kw));
}

function detectFriendly(text: string): boolean {
  return FRIENDLY_KEYWORDS.some((kw) => text.includes(kw));
}

function detectAccusation(text: string): boolean {
  return ACCUSE_KEYWORDS.some((kw) => text.includes(kw));
}

function detectPhase2Reveal(text: string): boolean {
  return PHASE2_KEYWORDS.some((kw) => text.includes(kw));
}

// ── 讀寫 localStorage ──────────────────────────────────────────

function readAttitude(sessionId: string, npcId: string): AttitudeData {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NPC_ATTITUDE(sessionId, npcId));
    if (!raw) return { ...DEFAULT_ATTITUDE };
    return { ...DEFAULT_ATTITUDE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_ATTITUDE };
  }
}

function writeAttitude(sessionId: string, npcId: string, data: AttitudeData): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NPC_ATTITUDE(sessionId, npcId), JSON.stringify(data));
  } catch { /* ignore */ }
}

// ── 公開 API ───────────────────────────────────────────────────

/**
 * 分析玩家訊息並更新此 NPC 的態度記錄。
 * 在 useChat.sendMessage 每次成功送出後呼叫。
 */
export function updateAttitude(
  sessionId: string,
  npcId:     string,
  userText:  string,
  currentAct = 1,
): void {
  try {
    const data = readAttitude(sessionId, npcId);
    if (detectHostile(userText))   data.hostileCount   += 1;
    if (detectFriendly(userText))  data.friendlyCount  += 1;
    if (detectAccusation(userText))  data.accusedKiller  = true;
    if (detectPhase2Reveal(userText)) data.revealedPhase2 = true;
    data.lastAct = currentAct;
    writeAttitude(sessionId, npcId, data);
  } catch { /* ignore */ }
}

/**
 * 產生注入 System Prompt 的「互動記錄」文字。
 * 若無記錄則回傳空字串。
 */
export function getAttitudeNotes(sessionId: string, npcId: string): string {
  try {
    const data = readAttitude(sessionId, npcId);
    const lines: string[] = [];

    if (data.accusedKiller) {
      lines.push("玩家曾直接指控你是造成失蹤案的兇手。不管你怎麼回應，你記得這件事。");
    }
    if (data.hostileCount >= 3) {
      lines.push(`玩家對你說過威脅或攻擊性的話（共 ${data.hostileCount} 次）。你對他的戒心比初次見面時更高。`);
    } else if (data.hostileCount >= 1) {
      lines.push("玩家曾有過一次強硬或帶攻擊性的語氣。你有留意到。");
    }
    if (data.friendlyCount >= 3) {
      lines.push("玩家對你一直保持友善和尊重的態度。這讓你願意多說一點。");
    }
    if (data.revealedPhase2) {
      lines.push("玩家曾在對話中暗示或透露自己可能是第二相體。這個資訊你知道了。");
    }

    if (lines.length === 0) return "";
    return `\n【你與這個人的互動記錄】\n${lines.join("\n")}`;
  } catch {
    return "";
  }
}
