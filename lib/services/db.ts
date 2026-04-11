/**
 * 資料庫服務層 — 統一匯出入口（向後相容）
 *
 * 各子模組：
 *  db-game.ts   — 遊戲場次相關
 *  db-chat.ts   — 對話 & NPC 狀態相關
 *  db-clues.ts  — 線索 & 道具相關
 *  db-scene.ts  — 場景互動相關
 */

export * from "./db-game";
export * from "./db-chat";
export * from "./db-clues";
export * from "./db-scene";
