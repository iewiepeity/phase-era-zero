/**
 * 隨機遊戲事件定義 — 15+ 個事件
 */

export type GameEventType = "positive" | "negative" | "neutral";

export interface GameEvent {
  id:          string;
  type:        GameEventType;
  title:       string;
  description: string;
  effect:      string;
}

export const GAME_EVENTS: GameEvent[] = [
  // ── 正面事件 ──────────────────────────────────────────────────
  {
    id:          "evt_informant_tip",
    type:        "positive",
    title:       "線人密報",
    description: "一個你不認識的人悄悄塞了一張紙條給你。上面只有幾個字，但對你的調查方向很有幫助。",
    effect:      "獲得額外線索提示",
  },
  {
    id:          "evt_trust_boost",
    type:        "positive",
    title:       "口耳相傳",
    description: "有人替你美言了幾句。接下來有個 NPC 對你更願意開口說話。",
    effect:      "某位 NPC 信任度提升",
  },
  {
    id:          "evt_lucky_find",
    type:        "positive",
    title:       "意外發現",
    description: "在翻找其他東西的時候，你意外找到了一樣看起來毫不相干、但很可能有用的東西。",
    effect:      "發現隱藏道具",
  },
  {
    id:          "evt_overheard",
    type:        "positive",
    title:       "牆有耳",
    description: "你在轉角聽到了兩個人的對話。他們沒發現你。他們說的內容讓你重新審視一條已知的線索。",
    effect:      "既有線索獲得新解讀",
  },
  {
    id:          "evt_old_record",
    type:        "positive",
    title:       "舊檔案",
    description: "某個地方存著一份被遺忘的文件，與這個案子有關聯。有人替你找到了入口。",
    effect:      "解鎖歷史檔案線索",
  },
  // ── 負面事件 ──────────────────────────────────────────────────
  {
    id:          "evt_npc_unavailable",
    type:        "negative",
    title:       "找不到人",
    description: "你想聯絡的那個人今天似乎不在。沒有任何說明，手機也沒人接。",
    effect:      "隨機一名 NPC 短暫不可用",
  },
  {
    id:          "evt_time_skip",
    type:        "negative",
    title:       "時間流逝",
    description: "你在等待一個訊息，卻沒等到。幾個小時就這樣過去了，什麼都沒有發生。",
    effect:      "時段強制推進",
  },
  {
    id:          "evt_red_herring",
    type:        "negative",
    title:       "錯誤方向",
    description: "你追查的一條線索其實是個死路。花了不少精力，什麼也沒得到。",
    effect:      "消耗額外行動點",
  },
  {
    id:          "evt_witness_scared",
    type:        "negative",
    title:       "目擊者退縮",
    description: "原本願意開口的人突然改了主意，說自己什麼都不知道。看起來有人先你一步去找過他。",
    effect:      "某位 NPC 信任度下降",
  },
  {
    id:          "evt_evidence_tampered",
    type:        "negative",
    title:       "線索被動過",
    description: "你之前記下的一條線索細節，和現在看到的不一樣了。有人在你後面悄悄動了什麼。",
    effect:      "線索可靠性降低警告",
  },
  // ── 中性事件 ──────────────────────────────────────────────────
  {
    id:          "evt_rain",
    type:        "neutral",
    title:       "下雨了",
    description: "賽德里斯的雨開始下了。街上的人少了很多，但留下來的都躲在角落說著自己的故事。",
    effect:      "氛圍變化，對話色調改變",
  },
  {
    id:          "evt_media_report",
    type:        "neutral",
    title:       "媒體報導",
    description: "今天的新聞開始討論這個案子。版本和你所知道的有一些出入。",
    effect:      "案件輿論狀態更新",
  },
  {
    id:          "evt_stranger_watching",
    type:        "neutral",
    title:       "陌生人的目光",
    description: "你感覺有人在遠處看著你。你轉身的時候，那個位置已經沒有人了。",
    effect:      "增加懸疑氣氛",
  },
  {
    id:          "evt_power_outage",
    type:        "neutral",
    title:       "短暫停電",
    description: "這一帶停電了幾分鐘。燈光回來的時候，有個地方的門開著——你確定你來的時候是關著的。",
    effect:      "場景狀態微妙變化",
  },
  {
    id:          "evt_old_connection",
    type:        "neutral",
    title:       "人際網絡",
    description: "你發現兩個你已經認識的人，原來早就認識彼此。這個關係你之前不知道。",
    effect:      "揭示 NPC 間的隱藏關係",
  },
  {
    id:          "evt_dead_end",
    type:        "neutral",
    title:       "暫時的瓶頸",
    description: "現在這個角度你已經調查得差不多了。也許從別的地方切入，會有新的發現。",
    effect:      "引導玩家轉換調查方向",
  },
];

export function getGameEventById(id: string): GameEvent | undefined {
  return GAME_EVENTS.find((e) => e.id === id);
}

export function getEventsByType(type: GameEventType): GameEvent[] {
  return GAME_EVENTS.filter((e) => e.type === type);
}
