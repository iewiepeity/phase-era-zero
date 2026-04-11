/**
 * NPC 關係圖 — 賽德里斯中所有人的相互認識關係
 *
 * 這裡定義的關係在兩個地方使用：
 * 1. 對話觸發（dialogue-triggers.ts）：A 見過 B 之後，C 會有不同反應
 * 2. System Prompt 注入：讓 NPC 的回答對其他人的事知之適當
 */

export type RelationshipType =
  | "acquaintance"    // 點頭之交，見過面
  | "colleague"       // 工作關係
  | "informant"       // 情報提供者
  | "observer"        // 默默觀察著對方
  | "suspect_of"      // 懷疑對方是關鍵人物
  | "connected_by"    // 因某事件有所牽連
  | "knows_secret";   // 知道對方的秘密

export interface NpcRelationship {
  npcA:        string;   // npcId
  npcB:        string;   // npcId
  type:        RelationshipType;
  /** A 對 B 的認識（從 A 的視角）*/
  aKnowsB:     string;
  /** B 對 A 的認識（從 B 的視角）*/
  bKnowsA:     string;
  /** 是否雙向（預設 true）*/
  bidirectional?: boolean;
}

export const NPC_RELATIONSHIPS: NpcRelationship[] = [

  // ── 陳姐 ─────────────────────────────────────────────────────
  {
    npcA:    "chen_jie",
    npcB:    "zhuanghe",
    type:    "acquaintance",
    aKnowsB: "你認識莊河，他偶爾來麵館吃東西。他是個老刑警，你知道他退休之後一直沒有真的放下那件案子。你不問他，他也不說，但你們都知道彼此知道一些事。",
    bKnowsA: "你認識陳姐，她的麵館是老城區少數幾個你覺得安全的地方。她不多話，但她聽過很多東西。你偶爾去那裡，不是因為麵好吃，是因為那裡沒有監視器。",
  },
  {
    npcA:    "chen_jie",
    npcB:    "zhengbo",
    type:    "acquaintance",
    aKnowsB: "鄭博是你的常客，大概每週來兩三次。你知道他做保險調查，你也知道他在查的案子和失蹤的人有關——但你從來沒有問過他。他坐在角落，有時候會看著門口，像是在等什麼人，或者在確認什麼人沒有跟著他進來。",
    bKnowsA: "陳姐知道的比她說的多。你去她的麵館不只是因為食物。那個地方的人說話比較直，也不會隨便去報告什麼。你在那裡問過她幾個問題，她只回答了一半，但那一半已經夠用了。",
  },
  {
    npcA:    "chen_jie",
    npcB:    "baiqiu",
    type:    "acquaintance",
    aKnowsB: "白秋的藥局就在隔壁，你們隔著一面牆住了好幾年。她很少來麵館，但偶爾來，都是有事要說。你知道她最近遇到了麻煩，你沒有問，但你也沒有假裝沒看見。",
    bKnowsA: "陳姐的麵館就在藥局隔壁。她是那種你不需要跟她解釋太多的人，她一眼就能看出你在狀況外還是狀況裡。你去她那裡，有時候是為了想清楚自己下一步怎麼做。",
  },

  // ── 韓卓 ─────────────────────────────────────────────────────
  {
    npcA:    "hanzhuo",
    npcB:    "linzhixia",
    type:    "colleague",
    aKnowsB: "林知夏是個大學生，她跑來案發現場做研究。一開始你不想讓她待在那裡，後來你發現她的觀察記錄比你的詳細，而且她注意到了一些你沒有注意到的東西。你們現在是某種非正式的合作關係，你不確定你信任她，但你需要她那份資料。",
    bKnowsA: "韓卓是鑑識人員，他把你趕走過幾次，後來他也把你留下來了。他知道你在找什麼，你也知道他害怕什麼。你們之間有一種彼此都不說出口的默契：你幫他看到他不願意往下看的東西，他讓你繼續留在那個現場。",
  },
  {
    npcA:    "hanzhuo",
    npcB:    "zhuanghe",
    type:    "connected_by",
    aKnowsB: "莊河以前是刑警，他調查過一個和這起案子有些關聯的案件。後來那個案子被抽走了，他也退休了。你見過他幾次，你知道他比你更清楚有些事為什麼沒有記錄在任何地方。",
    bKnowsA: "韓卓是鑑識員，他簽了 BTMA 的保密協議。你知道這意味著他看到了什麼，但不能說。你對他有些同情，你也對他有些警惕。同情是因為你明白那種處境，警惕是因為你不確定他在保護什麼。",
  },

  // ── 余霜 ─────────────────────────────────────────────────────
  {
    npcA:    "yushuang",
    npcB:    "it",
    type:    "connected_by",
    aKnowsB: "謝先生是一個你說不清楚怎麼定義的存在。你在 BTMA 的通道裡見過他幾次，也在醫院見過他。你知道他的狀況，你知道他在找什麼。你對他的感情很複雜，有一部分是某種同情，有一部分是某種恐懼。",
    bKnowsA: "余霜是護士，她照顧過林淵。她知道覺醒之後會發生什麼事，她也知道在覺醒發生之前，有些人是如何被準備的。你不確定她是被說服的，還是她選擇相信的，或者對她來說這兩件事沒有區別。",
  },
  {
    npcA:    "yushuang",
    npcB:    "baiqiu",
    type:    "knows_secret",
    aKnowsB: "白秋的藥局有一些特殊的進貨紀錄。你知道那些藥是給誰用的，你也知道白秋懷疑了什麼，但她選擇繼續賣。你不確定這算是共謀，還是算是一種她沒有選擇的沉默。",
    bKnowsA: "余霜是醫院的護士，她來過幾次，每次都是買那幾種特定的藥。你知道那些藥在病房裡不會是正常用量，但你沒有問她是給誰用的。你懷疑她，你不確定你懷疑的是對的。",
  },

  // ── 鄭博 ─────────────────────────────────────────────────────
  {
    npcA:    "zhengbo",
    npcB:    "baiqiu",
    type:    "informant",
    aKnowsB: "白秋有一份顧客記錄，那份記錄裡有幾個你正在追的名字。你去她的藥局問過她，她沒有直接告訴你，但她也沒有把你趕出去。你從她那裡拿到的不是答案，是更多的問題。",
    bKnowsA: "鄭博做保險調查，他的妻子也是失蹤案的受害者之一。他來過我的藥局，問了一些我明白他在找什麼的問題。我告訴了他一點東西，不是全部，只是讓他往對的方向走的一點。",
  },

  // ── 莊河 ─────────────────────────────────────────────────────
  {
    npcA:    "zhuanghe",
    npcB:    "taosheng",
    type:    "observer",
    aKnowsB: "陶生在碼頭工地工作，你觀察他有一段時間了。他是個老實工人，但他有一段記憶是空白的，他自己也知道。你不確定他知道自己知道什麼，這讓你很難判斷他是危險的還是只是另一個受害者。",
    bKnowsA: "那個老人有時候坐在茶攤，看著這邊。我以為他只是在喝茶，後來我發現他每次都在看我在做什麼。有一次我問他，他說他只是在觀察水面的狀態。我不知道該不該信他。",
  },
  {
    npcA:    "zhuanghe",
    npcB:    "hanzhuo",
    type:    "suspect_of",
    aKnowsB: "韓卓知道得比他說的多。那份他簽的協議，保密的不只是技術細節。他見過現場的真實狀態，但他在報告裡寫的是另一個版本。你不確定這是因為他害怕，還是因為他選擇了某一邊。",
    bKnowsA: "莊河是退休刑警，他追了一件案子追到最後沒有地方追。他知道那件事是怎麼被壓下去的，他也知道這次的案子跟那件事有沒有關聯。我不完全信任他，但我需要他說出來的那部分。",
    bidirectional: true,
  },

  // ── 林知夏 ───────────────────────────────────────────────────
  {
    npcA:    "linzhixia",
    npcB:    "it",
    type:    "observer",
    aKnowsB: "謝先生是一個典型的覺醒後不完整案例，在我的研究裡，他屬於第三類——覺醒了，但定錨點不穩定。我在醫院見過他，也在第九分局見過他。他每次都不太一樣，不是指性格，是指他的某些反應模式在變動。這在理論上不應該發生。",
    bKnowsA: "那個學生在研究我。我知道她在看什麼，我也知道她的紀錄裡有關於我的部分。這讓我感覺奇怪，不是因為她在研究，是因為她的某些問題的設計方式說明她已經知道了一些答案，但她假裝她不知道。",
  },
];

// ── 查詢函式 ────────────────────────────────────────────────────

/** 取得某個 NPC 認識的所有人的描述（從該 NPC 的視角）*/
export function getNpcRelationships(npcId: string): Array<{
  otherNpcId:  string;
  description: string;
  type:        RelationshipType;
}> {
  const result: ReturnType<typeof getNpcRelationships> = [];

  for (const rel of NPC_RELATIONSHIPS) {
    if (rel.npcA === npcId) {
      result.push({ otherNpcId: rel.npcB, description: rel.aKnowsB, type: rel.type });
    }
    if (rel.npcB === npcId && rel.bidirectional !== false) {
      result.push({ otherNpcId: rel.npcA, description: rel.bKnowsA, type: rel.type });
    }
  }
  return result;
}

/** 取得兩個 NPC 之間的關係描述（從 A 的視角看 B）*/
export function getRelationshipView(fromNpcId: string, toNpcId: string): string | null {
  for (const rel of NPC_RELATIONSHIPS) {
    if (rel.npcA === fromNpcId && rel.npcB === toNpcId) return rel.aKnowsB;
    if (rel.npcB === fromNpcId && rel.npcA === toNpcId && rel.bidirectional !== false)
      return rel.bKnowsA;
  }
  return null;
}
