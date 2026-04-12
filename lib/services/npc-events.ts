/**
 * NPC 主動事件服務 — NPC 可以主動向玩家「傳訊息」
 * 儲存：localStorage pez_npc_events_{sessionId}
 */

export interface NpcEvent {
  npcId:     string;
  npcName:   string;
  message:   string;
  timestamp: number;
  read:      boolean;
}

const KEY = (sessionId: string) => `pez_npc_events_${sessionId}`;

// 預設可能發送的訊息範本
const NPC_EVENT_TEMPLATES: { npcId: string; npcName: string; messages: string[] }[] = [
  {
    npcId:    "chen_jie",
    npcName:  "陳姐",
    messages: [
      "剛才有個陌生人來麵館問起你，說是你朋友。我覺得臉色不太對，你小心點。",
      "那個人我又想起來了——他走之前付帳的時候，手在抖。",
      "最近夜裡有人在麵館門口徘徊，你還在調查那件事嗎？",
    ],
  },
  {
    npcId:    "hanzhuo",
    npcName:  "韓卓",
    messages: [
      "我想到一件事，上次忘了說。案發當晚有人打電話給我，我沒接。你覺得重要嗎？",
      "我看到警方又來現場了，他們在找什麼你知道嗎？",
    ],
  },
  {
    npcId:    "yushuang",
    npcName:  "余霜",
    messages: [
      "有人在問我關於你的事。我沒說什麼，但你要注意了。",
      "分局裡有幾個人在私下討論這個案子，說法和官方的不一樣。",
    ],
  },
  {
    npcId:    "zhuanghe",
    npcName:  "莊河",
    messages: [
      "碼頭昨晚有艘船提前離港，沒有登記。你要不要查一下？",
      "有個我不認識的人問起了死者的名字，問我認不認識。",
    ],
  },
  {
    npcId:    "taosheng",
    npcName:  "陶生",
    messages: [
      "工地那邊挖出點東西，我不確定算不算線索，你有空過來看看？",
      "你上次問的那件事，我多想了想，感覺哪裡不對。",
    ],
  },
  {
    npcId:    "linzhixia",
    npcName:  "林知夏",
    messages: [
      "實驗室的數據有人動過，不是我，也不是我知道的人。",
      "我找到一份舊資料，也許和你在查的有關。你方便來拿嗎？",
    ],
  },
  {
    npcId:    "guard",
    npcName:  "老陳",
    messages: [
      "最近大廳有幾個陌生人進出，我記了臉，要跟你說一聲。",
      "昨晚加班，聽到幾句沒頭沒尾的對話，你要聽嗎？",
    ],
  },
  {
    npcId:    "reporter",
    npcName:  "蘇磊",
    messages: [
      "我的線人說有人在收買目擊者，讓他們改口。你知道這件事嗎？",
      "報社要我停下這個案子的報導，理由很牽強。有人在施壓。",
    ],
  },
];

function loadEvents(sessionId: string): NpcEvent[] {
  try {
    const raw = localStorage.getItem(KEY(sessionId));
    if (!raw) return [];
    return JSON.parse(raw) as NpcEvent[];
  } catch { return []; }
}

function saveEvents(sessionId: string, events: NpcEvent[]): void {
  try {
    localStorage.setItem(KEY(sessionId), JSON.stringify(events));
  } catch { /* ignore */ }
}

/** 隨機生成一個 NPC 事件，並儲存至 localStorage */
export function generateNpcEvent(sessionId: string): NpcEvent | null {
  const template = NPC_EVENT_TEMPLATES[Math.floor(Math.random() * NPC_EVENT_TEMPLATES.length)];
  const message  = template.messages[Math.floor(Math.random() * template.messages.length)];

  const existing = loadEvents(sessionId);
  // 避免同一訊息重複出現
  if (existing.some((e) => e.npcId === template.npcId && e.message === message)) return null;

  const event: NpcEvent = {
    npcId:     template.npcId,
    npcName:   template.npcName,
    message,
    timestamp: Date.now(),
    read:      false,
  };

  saveEvents(sessionId, [...existing, event]);
  return event;
}

export function getNpcEvents(sessionId: string): NpcEvent[] {
  return loadEvents(sessionId);
}

export function markEventRead(sessionId: string, idx: number): void {
  const events = loadEvents(sessionId);
  if (idx >= 0 && idx < events.length) {
    events[idx] = { ...events[idx], read: true };
    saveEvents(sessionId, events);
  }
}

export function hasUnreadEvents(sessionId: string): boolean {
  return loadEvents(sessionId).some((e) => !e.read);
}
