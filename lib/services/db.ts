/**
 * 資料庫服務層 — 統一重匯出
 *
 * 原本的單一大檔案已拆分為：
 *   db-game.ts  — Session 管理、難度、身份、幕次、分數
 *   db-chat.ts  — 對話訊息、NPC 狀態
 *   db-clues.ts — 線索欄、道具欄、線索合併
 *   db-scene.ts — 場景互動、場景造訪
 *
 * 此檔案保留所有公開 API 的重匯出，確保現有 import 路徑不受影響。
 */

export * from "./db-game";
export * from "./db-chat";
export * from "./db-clues";
export * from "./db-scene";
