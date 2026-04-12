/**
 * NPC 間對話（偷聽）— 玩家在場景中偷聽到的 NPC 間對話
 *
 * 每段對話在特定場景、特定條件下觸發。
 * 玩家讀完後自動獲得「偷聽線索」。
 */

export interface NpcConversationLine {
  speakerId: string;  // NPC ID
  name:      string;  // 顯示名稱
  text:      string;
}

export interface NpcConversation {
  id:          string;
  sceneId:     string;    // 觸發場景
  npcA:        string;
  npcB:        string;
  title:       string;
  description: string;    // 玩家發現此對話的情境描述
  lines:       NpcConversationLine[];
  trigger: {
    actMin?:          number;
    actMax?:          number;
    requiresVisited?: string[];
    identityOnly?:    "normal" | "phase2";
    probability:      number;
  };
  clueReward?: {
    clue_text: string;
    category:  "relationship" | "motive" | "method" | "alibi" | "general";
  };
  once: boolean;
}

export const NPC_CONVERSATIONS: NpcConversation[] = [

  // ── 陳姐麵館 ──────────────────────────────────────────────

  {
    id:          "eavesdrop_chen_zhuanghe_noodles",
    sceneId:     "chen_jie_noodles",
    npcA:        "chen_jie",
    npcB:        "zhuanghe",
    title:       "深夜的角落桌",
    description: "你端著碗坐在角落，他們以為你走了。",
    lines: [
      { speakerId: "zhuanghe", name: "莊河", text: "你上次說的那份記錄——" },
      { speakerId: "chen_jie", name: "陳姐", text: "我沒說過。" },
      { speakerId: "zhuanghe", name: "莊河", text: "你知道我的意思。" },
      { speakerId: "chen_jie", name: "陳姐", text: "那份東西不應該存在，更不應該被找到。" },
      { speakerId: "zhuanghe", name: "莊河", text: "但現在有人在問了。" },
      { speakerId: "chen_jie", name: "陳姐", text: "那個人問得越多，越危險。你知道的。" },
      { speakerId: "zhuanghe", name: "莊河", text: "……我知道。但這次不一樣。" },
    ],
    trigger:     { actMin: 2, probability: 0.4 },
    clueReward:  { clue_text: "陳姐和莊河似乎知道某份「不應該存在的記錄」，並且都認為追查這件事是危險的。", category: "relationship" },
    once:        true,
  },

  // ── 犯罪現場 ──────────────────────────────────────────────

  {
    id:          "eavesdrop_hanzhuo_linzhixia_crime",
    sceneId:     "crime_scene",
    npcA:        "hanzhuo",
    npcB:        "linzhixia",
    title:       "封鎖線外的爭論",
    description: "你繞到封鎖線的角落，聽見他們壓低了聲音。",
    lines: [
      { speakerId: "linzhixia", name: "林知夏", text: "你報告裡少了一樣東西。" },
      { speakerId: "hanzhuo",   name: "韓卓",   text: "我報告裡的東西都是我看到的。" },
      { speakerId: "linzhixia", name: "林知夏", text: "那個標記呢？左側牆面的那個。" },
      { speakerId: "hanzhuo",   name: "韓卓",   text: "那不在我的調查範圍。" },
      { speakerId: "linzhixia", name: "林知夏", text: "因為你故意把它排在範圍之外。" },
      { speakerId: "hanzhuo",   name: "韓卓",   text: "你不知道你在說什麼。" },
      { speakerId: "linzhixia", name: "林知夏", text: "那個標記和三年前的那個案子一樣。你比我更清楚。" },
      { speakerId: "hanzhuo",   name: "韓卓",   text: "……回去吧。" },
    ],
    trigger:    { actMin: 1, probability: 0.45 },
    clueReward: { clue_text: "犯罪現場牆面上有一個標記，韓卓刻意在報告中忽略——林知夏認為這個標記和三年前另一個案子有關。", category: "method" },
    once:       true,
  },

  // ── BTMA 大廳 ─────────────────────────────────────────────

  {
    id:          "eavesdrop_yushuang_it_btma",
    sceneId:     "btma_lobby",
    npcA:        "yushuang",
    npcB:        "it",
    title:       "走廊盡頭的低語",
    description: "電梯門關了，你在縫隙裡看見他們在大廳角落，聲音剛好夠你聽見。",
    lines: [
      { speakerId: "it",       name: "謝先生", text: "你昨晚去了太平間。" },
      { speakerId: "yushuang", name: "余霜",   text: "這和你有什麼關係。" },
      { speakerId: "it",       name: "謝先生", text: "你拿了什麼。" },
      { speakerId: "yushuang", name: "余霜",   text: "我沒有拿任何東西。" },
      { speakerId: "it",       name: "謝先生", text: "我們都知道那個協議怎麼說的。" },
      { speakerId: "yushuang", name: "余霜",   text: "你不要再說了。" },
      { speakerId: "it",       name: "謝先生", text: "如果他們找到的話——" },
      { speakerId: "yushuang", name: "余霜",   text: "他們找不到的。" },
    ],
    trigger:    { actMin: 2, requiresVisited: ["btma_lobby"], probability: 0.35 },
    clueReward: { clue_text: "余霜深夜去過太平間，取走了某樣東西。謝先生知道此事，並以「協議」暗示這違反了某種規定。", category: "relationship" },
    once:       true,
  },

  // ── 霧港碼頭 ──────────────────────────────────────────────

  {
    id:          "eavesdrop_zhuanghe_taosheng_dock",
    sceneId:     "foggy_port",
    npcA:        "zhuanghe",
    npcB:        "taosheng",
    title:       "船塢旁的閒話",
    description: "你靠在鐵架後面，他們以為這裡沒有人。",
    lines: [
      { speakerId: "taosheng", name: "陶生", text: "那個晚上，我一直在想，我到底看到什麼了。" },
      { speakerId: "zhuanghe", name: "莊河", text: "你說你什麼都不記得。" },
      { speakerId: "taosheng", name: "陶生", text: "對。可是我夢到了。" },
      { speakerId: "zhuanghe", name: "莊河", text: "夢裡你看到什麼。" },
      { speakerId: "taosheng", name: "陶生", text: "一個人。穿著工作服，但走路的方式不像工人。" },
      { speakerId: "zhuanghe", name: "莊河", text: "往哪個方向。" },
      { speakerId: "taosheng", name: "陶生", text: "往……倉庫的方向。我不確定是夢還是真的。" },
      { speakerId: "zhuanghe", name: "莊河", text: "繼續想。等你確定了，再告訴我。" },
    ],
    trigger:    { actMin: 1, probability: 0.4 },
    clueReward: { clue_text: "陶生在夢中（也可能是記憶）看到案發當晚有人穿著工作服走向廢棄倉庫，走路方式不像工人。", category: "alibi" },
    once:       true,
  },

  // ── 第九分局 ──────────────────────────────────────────────

  {
    id:          "eavesdrop_guard_zhengbo_precinct",
    sceneId:     "ninth_precinct",
    npcA:        "guard",
    npcB:        "zhengbo",
    title:       "走廊的低聲抱怨",
    description: "你路過分局走廊，聽見一個警衛在跟另一個人說話。",
    lines: [
      { speakerId: "guard",   name: "警衛", text: "你又來了。你不知道你不能繼續查這個嗎。" },
      { speakerId: "zhengbo", name: "鄭博", text: "我有調查的合法權利。" },
      { speakerId: "guard",   name: "警衛", text: "法律上是，但你最好想清楚你在找的東西會不會讓你惹上麻煩。" },
      { speakerId: "zhengbo", name: "鄭博", text: "我的妻子失蹤了。我沒有選擇。" },
      { speakerId: "guard",   name: "警衛", text: "……我知道。但這樓裡有些事我也不能說。" },
      { speakerId: "zhengbo", name: "鄭博", text: "你已經說了你能說的。謝謝。" },
    ],
    trigger:    { actMin: 1, probability: 0.5 },
    clueReward: { clue_text: "第九分局內部有人知道案子的更多細節，但受到某種限制不能說——這個案子在警察體制內也承受壓力。", category: "general" },
    once:       true,
  },

  // ── 醫療中心 ──────────────────────────────────────────────

  {
    id:          "eavesdrop_yushuang_mortician_medical",
    sceneId:     "medical_center",
    npcA:        "yushuang",
    npcB:        "mortician",
    title:       "走廊盡頭的文件",
    description: "你假裝在等人，他們從辦公室出來，聲音透過門縫傳出來。",
    lines: [
      { speakerId: "mortician", name: "老吳", text: "那份授權，我查不到對應的機構。" },
      { speakerId: "yushuang",  name: "余霜", text: "這是內部文件，不會在公開系統裡。" },
      { speakerId: "mortician", name: "老吳", text: "我做這行三十年了，「內部文件」我見多了。那個不是。" },
      { speakerId: "yushuang",  name: "余霜", text: "你想要什麼。" },
      { speakerId: "mortician", name: "老吳", text: "我只是要你知道，我記下來了。" },
      { speakerId: "yushuang",  name: "余霜", text: "……好。" },
    ],
    trigger:    { actMin: 2, probability: 0.35 },
    clueReward: { clue_text: "老吳懷疑余霜使用的授權文件是偽造的，並已記錄此事——余霜知道他知道。", category: "method" },
    once:       true,
  },

  // ── 林知夏實驗室 ──────────────────────────────────────────

  {
    id:          "eavesdrop_linzhixia_it_lab",
    sceneId:     "lin_lab",
    npcA:        "linzhixia",
    npcB:        "it",
    title:       "研究室的一問一答",
    description: "實驗室的隔音不好，你站在走廊聽見了你不應該聽見的東西。",
    lines: [
      { speakerId: "linzhixia", name: "林知夏", text: "你上次說你記得的比你表現出來的多。" },
      { speakerId: "it",        name: "謝先生", text: "我說過很多話。" },
      { speakerId: "linzhixia", name: "林知夏", text: "你知道林淵在死之前說了什麼。" },
      { speakerId: "it",        name: "謝先生", text: "你在問什麼。" },
      { speakerId: "linzhixia", name: "林知夏", text: "他說了一個人的名字。" },
      { speakerId: "it",        name: "謝先生", text: "……我聽見了。" },
      { speakerId: "linzhixia", name: "林知夏", text: "那個名字是誰。" },
      { speakerId: "it",        name: "謝先生", text: "不是你研究的那種問題的答案。" },
    ],
    trigger:    { actMin: 2, requiresVisited: ["lin_lab"], probability: 0.3 },
    clueReward: { clue_text: "謝先生聽到林淵死前說出的名字，但他拒絕透露——林知夏認為這個名字是研究中「不該問」的核心。", category: "relationship" },
    once:       true,
  },

  // ── 白秋藥局（B 路線限定）────────────────────────────────

  {
    id:          "eavesdrop_baiqiu_vendor_pharmacy",
    sceneId:     "bai_qiu_pharmacy",
    npcA:        "baiqiu",
    npcB:        "vendor",
    title:       "後門的小聲話",
    description: "你從後巷繞過去，聽見藥局後門的說話聲。",
    lines: [
      { speakerId: "vendor", name: "大姐", text: "你真的要繼續賣給他們嗎。" },
      { speakerId: "baiqiu", name: "白秋", text: "我沒有選擇。" },
      { speakerId: "vendor", name: "大姐", text: "你有。你只是怕。" },
      { speakerId: "baiqiu", name: "白秋", text: "你不知道他們能做什麼。" },
      { speakerId: "vendor", name: "大姐", text: "那個調查員如果找到你——" },
      { speakerId: "baiqiu", name: "白秋", text: "我知道。我在想辦法。" },
      { speakerId: "vendor", name: "大姐", text: "你最好快一點。" },
    ],
    trigger:    { actMin: 1, identityOnly: "phase2", probability: 0.4 },
    clueReward: { clue_text: "白秋知道藥品供應鏈有問題，有人脅迫她繼續配合——她感到恐懼，正在尋找出路。", category: "motive" },
    once:       true,
  },
];

// ── 查詢函式 ─────────────────────────────────────────────────

/** 取得某個場景可能觸發的對話列表 */
export function getSceneConversations(
  sceneId:       string,
  currentAct:    number,
  identity:      "normal" | "phase2",
  visitedScenes: string[],
  triggeredIds:  string[],
): NpcConversation[] {
  return NPC_CONVERSATIONS.filter((conv) => {
    if (conv.sceneId !== sceneId) return false;
    if (conv.once && triggeredIds.includes(conv.id)) return false;

    const t = conv.trigger;
    if (t.actMin !== undefined && currentAct < t.actMin) return false;
    if (t.actMax !== undefined && currentAct > t.actMax) return false;
    if (t.identityOnly !== undefined && identity !== t.identityOnly) return false;
    if (t.requiresVisited) {
      for (const s of t.requiresVisited) {
        if (!visitedScenes.includes(s)) return false;
      }
    }

    return Math.random() < t.probability;
  });
}

/** 標記某個對話已觸發（localStorage 管理）*/
export function markConversationTriggered(sessionId: string, convId: string): void {
  try {
    const key  = `pez_eavesdrop_${sessionId}`;
    const raw  = localStorage.getItem(key) ?? "";
    const ids  = raw ? raw.split(",") : [];
    if (!ids.includes(convId)) {
      ids.push(convId);
      localStorage.setItem(key, ids.join(","));
    }
  } catch { /* ignore */ }
}

/** 取得已觸發的對話 ID 列表 */
export function getTriggeredConversations(sessionId: string): string[] {
  try {
    const raw = localStorage.getItem(`pez_eavesdrop_${sessionId}`);
    if (!raw) return [];
    return raw.split(",").filter(Boolean);
  } catch { return []; }
}
