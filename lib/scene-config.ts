/**
 * 場景配置 — 賽德里斯的可訪問地點
 * Phase 6：全部 4 個場景解鎖，8 位 NPC 分佈
 */

export interface SceneNpc {
  id: string;
  name: string;
}

export interface Scene {
  id: string;
  name: string;
  district: string;
  description: string;
  ambience: string;
  npcs: SceneNpc[];
  locked: boolean;
  lockReason?: string;
  dangerLevel?: "low" | "medium" | "high";
}

export const SCENES: Scene[] = [
  {
    id: "chen_jie_noodles",
    name: "陳姐麵館",
    district: "中城區　P.E. 02",
    description:
      "老城區最後一間不裝監控的麵館。六張桌子，燈光有點黃。陳姐見過太多人進進出出。鄭博坐在角落，白秋偶爾從隔壁藥局走過來。",
    ambience: "嘴巴嚴，但茶底不淡",
    npcs: [
      { id: "chen_jie", name: "陳姐" },
      { id: "zhengbo",  name: "鄭博" },
      { id: "baiqiu",   name: "白秋" },
    ],
    locked: false,
    dangerLevel: "low",
  },
  {
    id: "crime_scene",
    name: "案發現場",
    district: "中城舊區暗巷",
    description:
      "第十四號失蹤案最後的目擊座標。封鎖線還在，但警察已經走了。韓卓在周圍做記錄，林知夏蹲在角落寫什麼東西。",
    ambience: "每一步都踩在別人留下的痕跡上",
    npcs: [
      { id: "hanzhuo",   name: "韓卓" },
      { id: "linzhixia", name: "林知夏" },
    ],
    locked: false,
    dangerLevel: "medium",
  },
  {
    id: "foggy_port",
    name: "霧港碼頭",
    district: "鋒岬港口",
    description:
      "貨船在這裡裝卸的不只是貨物。至少兩名失蹤者的路線在這裡交叉。莊河坐在茶攤，陶生在工地忙進忙出。",
    ambience: "霧裡的東西不一定是霧",
    npcs: [
      { id: "zhuanghe", name: "莊河" },
      { id: "taosheng", name: "陶生" },
    ],
    locked: false,
    dangerLevel: "medium",
  },
  {
    id: "ninth_precinct",
    name: "第九分局",
    district: "中城區執法中心",
    description:
      "把你列為重要關係人的地方。裡面的人在等你犯錯。余霜在走廊等候，謝先生坐著，背靠牆，看起來是在等什麼。",
    ambience: "進去就不一定能出來",
    npcs: [
      { id: "yushuang", name: "余霜" },
      { id: "it",       name: "謝先生" },
    ],
    locked: false,
    dangerLevel: "high",
  },
];

export function getScene(id: string): Scene | undefined {
  return SCENES.find((s) => s.id === id);
}
