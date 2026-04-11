/**
 * 場景物件型別定義 — 場景探索系統的核心資料結構
 */

export type SceneItemType = "npc" | "item" | "clue" | "environment";
export type InteractionType = "examine" | "pickup" | "discover" | "talk";

export interface SceneItem {
  id:               string;
  name:             string;
  shortDesc:        string;      // 2-3 words shown in scene list
  inspectText:      string;      // Higashino-style paragraph shown when examining
  type:             SceneItemType;
  icon:             string;      // emoji
  pickable:         boolean;     // can be added to inventory
  inventoryEntry?: {             // defined if pickable=true
    itemId:       string;
    name:         string;
    description:  string;
    icon:         string;
  };
  triggersClue:     boolean;
  clueContent?:     string;      // if triggersClue, the clue text player gets
  requiredAct:      number;      // min act to appear (1=always)
  requiredItemId?:  string;      // item id needed to unlock this interaction
  oneTimeOnly:      boolean;     // true = disappears after first interaction
  position:         string;      // location description like "吧台右側"
  npcId?:           string;      // if type==="npc", the NPC id for chat navigation
}
