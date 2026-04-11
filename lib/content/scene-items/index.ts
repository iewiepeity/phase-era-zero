/**
 * 場景物件索引 — 匯出所有場景的物件清單
 */

export type { SceneItem, SceneItemType, InteractionType } from "./types";

export { CHEN_JIE_NOODLES_ITEMS }   from "./chen-jie-noodles";
export { CRIME_SCENE_ITEMS }         from "./crime-scene";
export { FOGGY_DOCK_ITEMS }          from "./foggy-dock";
export { PRECINCT_9_ITEMS }          from "./precinct-9";
export { BAI_QIU_PHARMACY_ITEMS }    from "./bai-qiu-pharmacy";
export { MEDICAL_CENTER_ITEMS }      from "./medical-center";
export { LIN_LAB_ITEMS }             from "./lin-lab";
export { BTMA_LOBBY_ITEMS }          from "./btma-lobby";
export { ABANDONED_WAREHOUSE_ITEMS } from "./abandoned-warehouse";
export { ZHENGBO_OFFICE_ITEMS }      from "./zhengbo-office";

import { CHEN_JIE_NOODLES_ITEMS }   from "./chen-jie-noodles";
import { CRIME_SCENE_ITEMS }         from "./crime-scene";
import { FOGGY_DOCK_ITEMS }          from "./foggy-dock";
import { PRECINCT_9_ITEMS }          from "./precinct-9";
import { BAI_QIU_PHARMACY_ITEMS }    from "./bai-qiu-pharmacy";
import { MEDICAL_CENTER_ITEMS }      from "./medical-center";
import { LIN_LAB_ITEMS }             from "./lin-lab";
import { BTMA_LOBBY_ITEMS }          from "./btma-lobby";
import { ABANDONED_WAREHOUSE_ITEMS } from "./abandoned-warehouse";
import { ZHENGBO_OFFICE_ITEMS }      from "./zhengbo-office";
import type { SceneItem }            from "./types";

const SCENE_ITEMS_MAP: Record<string, SceneItem[]> = {
  chen_jie_noodles:    CHEN_JIE_NOODLES_ITEMS,
  crime_scene:         CRIME_SCENE_ITEMS,
  foggy_port:          FOGGY_DOCK_ITEMS,
  ninth_precinct:      PRECINCT_9_ITEMS,
  bai_qiu_pharmacy:    BAI_QIU_PHARMACY_ITEMS,
  medical_center:      MEDICAL_CENTER_ITEMS,
  lin_lab:             LIN_LAB_ITEMS,
  btma_lobby:          BTMA_LOBBY_ITEMS,
  abandoned_warehouse: ABANDONED_WAREHOUSE_ITEMS,
  zhengbo_office:      ZHENGBO_OFFICE_ITEMS,
};

/**
 * 取得指定場景的所有物件。
 * @param sceneId - 場景 ID（如 "chen_jie_noodles"）
 * @returns 該場景的 SceneItem 陣列，找不到則回傳空陣列
 */
export function getSceneItems(sceneId: string): SceneItem[] {
  return SCENE_ITEMS_MAP[sceneId] ?? [];
}
