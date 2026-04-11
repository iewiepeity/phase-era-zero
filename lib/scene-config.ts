/**
 * 場景配置 — 賽德里斯的可訪問地點
 * Phase 7：全部 10 個場景，分四個城市區域
 *
 * 區域分佈：
 *  舊城區    — 陳姐麵館、白秋藥局
 *  中城核心  — 案發現場、第九分局、BTMA 大廳、鄭博辦公室
 *  港口區    — 霧港碼頭、廢棄倉庫
 *  學術醫療  — 中央醫療院、大學研究室
 */

export interface SceneNpc {
  id: string;
  name: string;
}

export interface Scene {
  id: string;
  name: string;
  district: string;
  districtArea: "old_city" | "central" | "harbor" | "academic";
  description: string;
  ambience: string;
  npcs: SceneNpc[];
  locked: boolean;
  lockReason?: string;
  requiredAct?: number;
  dangerLevel?: "low" | "medium" | "high";
}

// ── 區域定義 ────────────────────────────────────────────────────

export const DISTRICT_AREAS: Record<Scene["districtArea"], {
  label: string;
  sublabel: string;
  accentColor: string;
}> = {
  old_city:  { label: "舊城區",   sublabel: "OLD CITY",    accentColor: "#f59e0b" },
  central:   { label: "中城核心", sublabel: "CENTRAL",     accentColor: "#5bb8ff" },
  harbor:    { label: "港口區",   sublabel: "HARBOR",      accentColor: "#14b8a6" },
  academic:  { label: "學術醫療", sublabel: "ACADEMIC",    accentColor: "#c084fc" },
};

// ── 場景清單 ────────────────────────────────────────────────────

export const SCENES: Scene[] = [

  // ── 舊城區 ────────────────────────────────────────────────────
  {
    id:           "chen_jie_noodles",
    name:         "陳姐麵館",
    district:     "中城區　P.E. 02",
    districtArea: "old_city",
    description:
      "老城區最後一間不裝監控的麵館。六張桌子，燈光有點黃。陳姐見過太多人進進出出。鄭博坐在角落，白秋偶爾從隔壁藥局走過來。林太太有時候進來喝茶。",
    ambience:     "嘴巴嚴，但茶底不淡",
    npcs: [
      { id: "chen_jie",       name: "陳姐" },
      { id: "zhengbo",        name: "鄭博" },
      { id: "baiqiu",         name: "白秋" },
      { id: "neighbor",       name: "林太太" },
      { id: "vendor",         name: "大姐" },
      { id: "player_neighbor", name: "陳太太" },
    ],
    locked:      false,
    dangerLevel: "low",
  },
  {
    id:           "bai_qiu_pharmacy",
    name:         "白秋藥局",
    district:     "舊城商業區",
    districtArea: "old_city",
    description:
      "白秋的藥局緊鄰陳姐麵館，門面很窄，裡面比外面深。她知道哪些人在買不對的藥，知道哪些人失蹤之前來過這裡。旁邊的便利商店有個夜班店員，什麼都記著。",
    ambience:     "知道太多的人，通常說得最少",
    npcs: [
      { id: "baiqiu",    name: "白秋" },
      { id: "zhengbo",   name: "鄭博" },
      { id: "clerk",     name: "小劉" },
      { id: "bartender", name: "老秦" },
      { id: "roommate",  name: "阿傑" },
    ],
    locked:      false,
    dangerLevel: "low",
  },

  // ── 中城核心 ──────────────────────────────────────────────────
  {
    id:           "crime_scene",
    name:         "案發現場",
    district:     "中城舊區暗巷",
    districtArea: "central",
    description:
      "第十四號失蹤案最後的目擊座標。封鎖線還在，但警察已經走了。韓卓在周圍做記錄，林知夏蹲在角落寫什麼東西。一個記者在外圍拍照，不讓人靠近。",
    ambience:     "每一步都踩在別人留下的痕跡上",
    npcs: [
      { id: "hanzhuo",   name: "韓卓" },
      { id: "linzhixia", name: "林知夏" },
      { id: "reporter",  name: "蘇磊" },
      { id: "homeless",  name: "老默" },
    ],
    locked:      false,
    dangerLevel: "medium",
  },
  {
    id:           "ninth_precinct",
    name:         "第九分局",
    district:     "中城區執法中心",
    districtArea: "central",
    description:
      "把你列為重要關係人的地方。裡面的人在等你犯錯。余霜在走廊等候，謝先生坐著，背靠牆，看起來是在等什麼。",
    ambience:     "進去就不一定能出來",
    npcs: [
      { id: "yushuang", name: "余霜" },
      { id: "it",       name: "謝先生" },
      { id: "lawyer",   name: "嚴律師" },
    ],
    locked:      false,
    dangerLevel: "high",
  },
  {
    id:           "btma_lobby",
    name:         "BTMA 機構大廳",
    district:     "中城核心商業區",
    districtArea: "central",
    description:
      "把莊河的案子拿走的地方，把韓卓的嘴封住的地方。大廳看起來和普通辦公大樓沒有區別。謝先生在這裡等著，余霜熟門熟路地進出。守門的老陳什麼都記著。",
    ambience:     "正式的外表之下，有些事沒有紀錄",
    npcs: [
      { id: "it",       name: "謝先生" },
      { id: "yushuang", name: "余霜" },
      { id: "guard",    name: "老陳" },
    ],
    locked:      true,
    lockReason:  "需要先從其他地點蒐集關於 BTMA 的線索",
    requiredAct: 2,
    dangerLevel: "high",
  },
  {
    id:           "zhengbo_office",
    name:         "鄭博辦公室",
    district:     "中城商業區",
    districtArea: "central",
    description:
      "他說他在做保險理賠調查。他辦公室的牆告訴你一個不同的故事。十四個人的名字、照片、時間線，以及一個你查不到的受益人名字。",
    ambience:     "數字不說謊，但數字可以選擇說什麼",
    npcs: [
      { id: "zhengbo",   name: "鄭博" },
      { id: "old_friend", name: "阿文" },
    ],
    locked:      false,
    dangerLevel: "low",
  },

  // ── 港口區 ────────────────────────────────────────────────────
  {
    id:           "foggy_port",
    name:         "霧港碼頭",
    district:     "鋒岬港口",
    districtArea: "harbor",
    description:
      "貨船在這裡裝卸的不只是貨物。至少兩名失蹤者的路線在這裡交叉。莊河坐在茶攤，陶生在工地忙進忙出。魏師傅的車停在碼頭入口，等著下一個客人。",
    ambience:     "霧裡的東西不一定是霧",
    npcs: [
      { id: "zhuanghe",   name: "莊河" },
      { id: "taosheng",   name: "陶生" },
      { id: "taxi_driver", name: "魏師傅" },
    ],
    locked:      false,
    dangerLevel: "medium",
  },
  {
    id:           "abandoned_warehouse",
    name:         "廢棄倉庫",
    district:     "鋒岬港口舊倉儲區",
    districtArea: "harbor",
    description:
      "碼頭旁邊那一排舊倉庫，有一間的鎖被撬過。貨物清單上有一筆特殊設備，收件人不是人，是一個機構縮寫。莊河和陶生都認識這個地方。",
    ambience:     "有些事情消失，不是因為不存在，是因為有人花了力氣讓它消失",
    npcs: [
      { id: "taosheng", name: "陶生" },
      { id: "zhuanghe", name: "莊河" },
    ],
    locked:      false,
    dangerLevel: "high",
  },

  // ── 學術醫療 ──────────────────────────────────────────────────
  {
    id:           "medical_center",
    name:         "中央醫療院",
    district:     "中城醫療區",
    districtArea: "academic",
    description:
      "林淵覺醒的地方，也是余霜的工作地點。三樓有一間舊病房，牆壁重新刷過漆。病歷記錄有十四行被遮住。謝先生有時候會在候診區坐著。",
    ambience:     "這裡治的不只是身體上的病",
    npcs: [
      { id: "yushuang",  name: "余霜" },
      { id: "it",        name: "謝先生" },
      { id: "mortician", name: "老吳" },
    ],
    locked:      false,
    dangerLevel: "medium",
  },
  {
    id:           "lin_lab",
    name:         "大學研究室",
    district:     "賽德里斯大學　學院南區",
    districtArea: "academic",
    description:
      "林知夏把這裡當成她的第二個案發現場。冷藏架上有十四份樣本，白板上的時間軸在林淵覺醒的日期之後停下來。韓卓偶爾來核對數據。方教授的研究室就在隔壁，燈常亮著。",
    ambience:     "她記錄的比她說的還要多",
    npcs: [
      { id: "linzhixia", name: "林知夏" },
      { id: "hanzhuo",   name: "韓卓" },
      { id: "professor", name: "方教授" },
    ],
    locked:      false,
    dangerLevel: "medium",
  },
];

export function getScene(id: string): Scene | undefined {
  return SCENES.find((s) => s.id === id);
}

/** 依區域分組場景 */
export function getScenesByArea(): Record<Scene["districtArea"], Scene[]> {
  const result: Record<Scene["districtArea"], Scene[]> = {
    old_city:  [],
    central:   [],
    harbor:    [],
    academic:  [],
  };
  for (const scene of SCENES) {
    result[scene.districtArea].push(scene);
  }
  return result;
}
