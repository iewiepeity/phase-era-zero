/**
 * NPC 主動事件系統 — NPC 在特定條件下向玩家發送通知
 *
 * 事件儲存在 localStorage，Hub 頁面在每次載入時讀取並顯示。
 * 事件由對話服務和場景服務在特定條件下觸發。
 */

export type NpcEventType =
  | "tip"       // NPC 提供新線索或提示
  | "warning"   // NPC 警告玩家注意某件事
  | "request"   // NPC 要求玩家做某件事
  | "reveal"    // NPC 主動披露重要訊息
  | "rumor";    // NPC 散播謠言，可能為假

export interface NpcEvent {
  id:        string;
  npcId:     string;
  npcName:   string;
  type:      NpcEventType;
  message:   string;
  sceneId?:  string;   // 若在特定場景觸發
  actMin?:   number;   // 最低幕次才會出現
  read:      boolean;
  createdAt: number;   // timestamp
}

// ── 讀取 ──────────────────────────────────────────────────────

function storageKey(sessionId: string): string {
  return `pez_npc_events_${sessionId}`;
}

export function getNpcEvents(sessionId: string): NpcEvent[] {
  try {
    const raw = localStorage.getItem(storageKey(sessionId));
    if (!raw) return [];
    return JSON.parse(raw) as NpcEvent[];
  } catch { return []; }
}

export function getUnreadNpcEvents(sessionId: string): NpcEvent[] {
  return getNpcEvents(sessionId).filter((e) => !e.read);
}

// ── 寫入 ──────────────────────────────────────────────────────

export function pushNpcEvent(
  sessionId: string,
  event: Omit<NpcEvent, "id" | "read" | "createdAt">,
): void {
  try {
    const events = getNpcEvents(sessionId);
    const newEvent: NpcEvent = {
      ...event,
      id:        `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      read:      false,
      createdAt: Date.now(),
    };
    // 同一 NPC 相同訊息不重複推送
    const isDuplicate = events.some(
      (e) => e.npcId === event.npcId && e.message === event.message,
    );
    if (isDuplicate) return;
    events.push(newEvent);
    localStorage.setItem(storageKey(sessionId), JSON.stringify(events));
  } catch { /* ignore */ }
}

export function markNpcEventRead(sessionId: string, eventId: string): void {
  try {
    const events = getNpcEvents(sessionId).map((e) =>
      e.id === eventId ? { ...e, read: true } : e,
    );
    localStorage.setItem(storageKey(sessionId), JSON.stringify(events));
  } catch { /* ignore */ }
}

export function markAllNpcEventsRead(sessionId: string): void {
  try {
    const events = getNpcEvents(sessionId).map((e) => ({ ...e, read: true }));
    localStorage.setItem(storageKey(sessionId), JSON.stringify(events));
  } catch { /* ignore */ }
}

export function clearNpcEvents(sessionId: string): void {
  try {
    localStorage.removeItem(storageKey(sessionId));
  } catch { /* ignore */ }
}

// ── 預設事件模板（由對話觸發後呼叫）─────────────────────────

/** NPC 在對話後主動留下訊息的情境模板 */
export const NPC_EVENT_TEMPLATES: Record<string, Array<{
  type:    NpcEventType;
  message: string;
  actMin?: number;
}>> = {
  chen_jie: [
    { type: "tip",     message: "陳姐在你離開後，悄悄塞了一張紙條在桌上。上面只寫著：「碼頭，三更前。」", actMin: 2 },
    { type: "warning", message: "陳姐打了個電話，你只聽到她說：「有人在問，要小心。」" },
  ],
  hanzhuo: [
    { type: "reveal",  message: "韓卓發了一則訊息給你，附了一張模糊的照片，標題寫：「你需要看這個。」", actMin: 2 },
    { type: "warning", message: "韓卓留話說：「有人在查我的紀錄，可能和你有關。」" },
  ],
  yushuang: [
    { type: "request", message: "余霜傳話說：「明天不要去醫院，換個地方見。」", actMin: 2 },
    { type: "rumor",   message: "余霜說她聽到的消息：「林淵那邊有新的動作。」但她強調這只是傳言。" },
  ],
  zhengbo: [
    { type: "tip",    message: "鄭博寄來一份加密附件，密碼是你們第一次見面說的那個字。", actMin: 2 },
    { type: "reveal", message: "鄭博說他整理了一份名單，上面有五個名字，都和失蹤案有關。" },
  ],
  baiqiu: [
    { type: "tip",     message: "白秋在藥局外面擺了一個小紙袋，裡面是一份她說「找到了的」紀錄。", actMin: 2 },
    { type: "warning", message: "白秋說藥局最近有人一直在門口張望，她不確定是不是針對你。" },
  ],
  zhuanghe: [
    { type: "tip",    message: "莊河在你的口袋裡塞了一張舊地圖，角落有一個紅圈。", actMin: 2 },
    { type: "reveal", message: "莊河說：「那份報告被人調走了，但副本還在某個地方。我知道在哪。」" },
  ],
  linzhixia: [
    { type: "reveal", message: "林知夏整理了她的觀察筆記發給你，第三頁有一段她說她「不確定是不是巧合」的記錄。", actMin: 2 },
    { type: "tip",    message: "林知夏說：「謝先生下午去過你來之前的那個場景，我有拍到他。」" },
  ],
  it: [
    { type: "rumor",   message: "謝先生留話說：「你問的那件事……我不是唯一一個知道的人。」" },
    { type: "warning", message: "謝先生傳了一個地址，附言：「不要在人多的時候去。」", actMin: 3 },
  ],
  taosheng: [
    { type: "tip",    message: "陶生說他突然想起來了一些事情，問你什麼時候有空再說一次。" },
    { type: "reveal", message: "陶生說：「那個夜晚，我記得一件我一直沒說的事——倉庫有人出來。」", actMin: 3 },
  ],
};

/**
 * 根據 NPC ID 隨機選取一個主動事件模板並推送。
 * 通常在對話達到某個信任閾值後呼叫。
 */
export function triggerRandomNpcEvent(
  sessionId:  string,
  npcId:      string,
  npcName:    string,
  currentAct: number = 1,
): void {
  const templates = NPC_EVENT_TEMPLATES[npcId];
  if (!templates || templates.length === 0) return;

  const eligible = templates.filter((t) => (t.actMin ?? 1) <= currentAct);
  if (eligible.length === 0) return;

  const template = eligible[Math.floor(Math.random() * eligible.length)];
  pushNpcEvent(sessionId, {
    npcId,
    npcName,
    type:    template.type,
    message: template.message,
  });
}
