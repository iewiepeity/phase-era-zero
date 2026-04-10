/**
 * 場景配置 — 賽德里斯的可訪問地點
 * Phase 4：只有陳姐麵館開放
 */

export interface SceneNpc {
  id: string;
  name: string;
}

export interface Scene {
  id: string;
  name: string;
  district: string;          // 區域標示，例：中城區 P.E. 02
  description: string;       // 玩家看到的場景描述
  ambience: string;          // 短句氛圍標語（顯示在卡片底部）
  npcs: SceneNpc[];
  locked: boolean;
  lockReason?: string;       // 鎖定原因（顯示在卡片上）
  dangerLevel?: "low" | "medium" | "high";
}

export const SCENES: Scene[] = [
  {
    id: "chen_jie_noodles",
    name: "陳姐麵館",
    district: "中城區　P.E. 02",
    description:
      "老城區最後一間不裝監控的麵館。六張桌子，燈光有點黃。陳姐見過太多人進進出出。",
    ambience: "嘴巴嚴，但茶底不淡",
    npcs: [{ id: "chen_jie", name: "陳姐" }],
    locked: false,
    dangerLevel: "low",
  },
  {
    id: "crime_scene",
    name: "案發現場",
    district: "中城舊區暗巷",
    description:
      "第十四號失蹤案最後的目擊座標。封鎖線還在，但警察已經走了。現場有你沒看懂的東西。",
    ambience: "每一步都踩在別人留下的痕跡上",
    npcs: [],
    locked: true,
    lockReason: "即將開放",
    dangerLevel: "medium",
  },
  {
    id: "foggy_port",
    name: "霧港碼頭",
    district: "鋒岬港口",
    description:
      "貨船在這裡裝卸的不只是貨物。至少兩名失蹤者的路線在這裡交叉。",
    ambience: "霧裡的東西不一定是霧",
    npcs: [],
    locked: true,
    lockReason: "即將開放",
    dangerLevel: "medium",
  },
  {
    id: "ninth_precinct",
    name: "第九分局",
    district: "中城區執法中心",
    description:
      "把你列為重要關係人的地方。裡面的人在等你犯錯。",
    ambience: "進去就不一定能出來",
    npcs: [],
    locked: true,
    lockReason: "危險　謹慎行事",
    dangerLevel: "high",
  },
];

export function getScene(id: string): Scene | undefined {
  return SCENES.find((s) => s.id === id);
}
