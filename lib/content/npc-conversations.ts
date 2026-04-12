/**
 * NPC 偷聽對話 — 玩家在場景中可以旁觀的 NPC 對話片段
 */

export interface OverheardConversation {
  id:        string;
  sceneId:   string;
  npcIds:    string[];
  topic:     string;
  snippet:   { speaker: string; line: string }[];
  condition?: string;
}

export const OVERHEARD_CONVERSATIONS: OverheardConversation[] = [
  {
    id:      "oc_noodles_01",
    sceneId: "chen_jie_noodles",
    npcIds:  ["chen_jie", "neighbor"],
    topic:   "失蹤者的舊事",
    snippet: [
      { speaker: "林太太", line: "陳姐，你說那個人——他以前在哪邊工作的？" },
      { speaker: "陳姐",   line: "……我也不太清楚。他有時候說起話來，像是懂很多，又像是在藏什麼。" },
      { speaker: "林太太", line: "就是說嘛。這種人，消失了也不奇怪。" },
    ],
  },
  {
    id:      "oc_noodles_02",
    sceneId: "chen_jie_noodles",
    npcIds:  ["vendor"],
    topic:   "夜市的陌生人",
    snippet: [
      { speaker: "大姐", line: "昨晚夜市有個男的，一直在問死者住在哪。我說不知道，他就走了。" },
      { speaker: "大姐", line: "……看起來不像本地人，眼神怪怪的。" },
    ],
  },
  {
    id:      "oc_crime_01",
    sceneId: "crime_scene",
    npcIds:  ["hanzhuo", "reporter"],
    topic:   "現場的疑點",
    snippet: [
      { speaker: "蘇磊", line: "你說倒下的位置不對——什麼意思？" },
      { speaker: "韓卓", line: "我沒說。你誰啊你。" },
      { speaker: "蘇磊", line: "記者。就算你不說，我也會找到的。" },
    ],
  },
  {
    id:      "oc_crime_02",
    sceneId: "crime_scene",
    npcIds:  ["homeless"],
    topic:   "老默的喃喃自語",
    snippet: [
      { speaker: "老默", line: "……那晚有兩個人。不是一個。官方說一個，我看到兩個。" },
      { speaker: "老默", line: "沒人信我。算了。" },
    ],
  },
  {
    id:      "oc_port_01",
    sceneId: "foggy_port",
    npcIds:  ["zhuanghe", "taxi_driver"],
    topic:   "碼頭的異常船隻",
    snippet: [
      { speaker: "魏師傅", line: "莊哥，昨晚那艘船是哪來的？沒掛旗。" },
      { speaker: "莊河",   line: "你少管。看到了就當沒看到。" },
      { speaker: "魏師傅", line: "……行吧。反正跟我沒關係。" },
    ],
  },
  {
    id:      "oc_port_02",
    sceneId: "foggy_port",
    npcIds:  ["taosheng"],
    topic:   "工地發現的東西",
    snippet: [
      { speaker: "陶生", line: "（低聲打電話）……挖到的那個我已經蓋回去了。你放心。" },
      { speaker: "陶生", line: "……什麼都沒有。明白嗎？什麼都沒有挖到。" },
    ],
  },
  {
    id:      "oc_precinct_01",
    sceneId: "ninth_precinct",
    npcIds:  ["yushuang", "lawyer"],
    topic:   "案件文件的問題",
    snippet: [
      { speaker: "嚴律師", line: "余警官，卷宗裡少了第十七頁。" },
      { speaker: "余霜",   line: "……我去查。" },
      { speaker: "嚴律師", line: "不用查了。我知道那頁在哪，我只是想看看你的反應。" },
    ],
  },
  {
    id:      "oc_precinct_02",
    sceneId: "ninth_precinct",
    npcIds:  ["it", "guard"],
    topic:   "監控錄像的空白",
    snippet: [
      { speaker: "老陳",   line: "謝先生，走廊那個監控，那天晚上有沒有錄到東西？" },
      { speaker: "謝先生", line: "系統當機了。一個小時的空白。" },
      { speaker: "老陳",   line: "這麼巧……" },
      { speaker: "謝先生", line: "就是這麼巧。" },
    ],
  },
  {
    id:      "oc_medical_01",
    sceneId: "medical_center",
    npcIds:  ["mortician"],
    topic:   "太平間的奇怪事",
    snippet: [
      { speaker: "老吳", line: "……遺體送來的時候，有個東西不見了。本來應該在口袋裡的。" },
      { speaker: "老吳", line: "我問了送來的人，他說從來就沒有。但我第一次看的時候，分明有個東西……" },
    ],
  },
  {
    id:      "oc_lab_01",
    sceneId: "lin_lab",
    npcIds:  ["linzhixia", "professor"],
    topic:   "數據被竄改的可能",
    snippet: [
      { speaker: "方教授", line: "知夏，這批數據你有沒有存備份？" },
      { speaker: "林知夏", line: "有。但是……和系統裡的對不上。" },
      { speaker: "方教授", line: "你知道這意味著什麼嗎？" },
      { speaker: "林知夏", line: "意味著有人動過伺服器。" },
    ],
  },
];

export function getOverheardConversations(sceneId: string): OverheardConversation[] {
  return OVERHEARD_CONVERSATIONS.filter((c) => c.sceneId === sceneId);
}
