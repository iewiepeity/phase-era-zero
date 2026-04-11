# 相變世紀：Zero — 功能審計報告

> 審計日期：2026-04-11
> 對照文件：相變世紀_Zero_企劃書_v4.0.docx + 開發計劃 v1.0
> 審計範圍：Phase 0 ~ Phase 6 實裝內容

---

## 一、企劃書要求 vs 實裝狀態

### 核心引擎

| 功能 | 狀態 | 說明 |
|-----|------|------|
| Seed-based 隨機引擎（mulberry32）| ✅ | `lib/random-engine.ts`，可重現 |
| 9 個合法 killer+motive 對 | ✅ | `COMPATIBILITY` 矩陣驗證 |
| 12 種失蹤者關係（R1–R12）| ✅ | `RELATIONSHIPS` 陣列，random 選取 |
| 12 個補助真相元素 | ✅ | `TRUTH_ELEMENTS` 陣列 |
| 真相字串生成 | ✅ | 格式 `P{motive}{idx}{motive}-{mmdd}-{seed}-{rel}-{elem}` |
| 兼容性矩陣驗證 | ✅ | `FORBIDDEN_PAIRS` + `REQUIRED_ELEMENTS` |
| 理論組合數 29,952 種 | ✅ | 9 對 × 12 關係 × 12 元素 × 組合 |

### 玩家開場流程

| 功能 | 狀態 | 說明 |
|-----|------|------|
| 遊戲大廳頁面 | ✅ | `app/game/page.tsx`，開新局 + 繼續上次 |
| 開場固定敘事（5 段打字機）| ✅ | `app/game/[sessionId]/intro/page.tsx` |
| 身份選擇（Route A/B）| ✅ | `app/game/[sessionId]/identity/page.tsx`，寫入 DB |
| 難度選擇（4 等級）| ✅ | `app/game/[sessionId]/difficulty/page.tsx`，寫入 DB |

### NPC 系統

| 功能 | 狀態 | 說明 |
|-----|------|------|
| 9 位 NPC 完整人設 | ✅ | `lib/content/npc-*.ts`，各 100+ 行 |
| 9 位 NPC 幕次狀態地圖（Act 1–10）| ✅ | `actStateMap` 每位 NPC 均定義 |
| 9 位 NPC 動態線索函式 | ✅ | `buildXxxClues(config)`，各 7–8 條模板 |
| 線索 killerFilter / motiveFilter | ✅ | 依本局配置動態過濾 |
| 線索觸發條件（minAffinity / requiredAct / behaviorTrigger）| ✅ | `filterAvailableClues()` |
| NPC 信任度增量計算 | ✅ | goodbye/friendly/default 三段增量 |
| NPC 色彩系統 | ✅ | `NPC_COLORS`，9 種獨特配色 |
| `sceneId` 場景映射 | ✅ | `NpcDefinition.sceneId` 欄位 |

### 場景系統

| 功能 | 狀態 | 說明 |
|-----|------|------|
| 4 個場景全解鎖 | ✅ | `lib/scene-config.ts` |
| 陳姐麵館（3 NPC）| ✅ | 陳姐、鄭博、白秋 |
| 案發現場（2 NPC）| ✅ | 韓卓、林知夏 |
| 霧港碼頭（2 NPC）| ✅ | 莊河、陶生 |
| 第九分局（2 NPC）| ✅ | 余霜、謝先生 |
| 場景危險等級標記 | ✅ | low / medium / high |

### AI 對話系統

| 功能 | 狀態 | 說明 |
|-----|------|------|
| Gemini 2.5 Flash 對話 | ✅ | `lib/services/gemini.ts` |
| Prompt 動態組裝 | ✅ | `buildNpcPrompt()`，幕次 + 線索 + Route B 限制 |
| 多輪對話歷史 | ✅ | 歷史傳入 Gemini context |
| 打字機效果 | ✅ | `useTypewriter` hook |
| Rate limit 處理（429）| ✅ | `isRateLimitError()` 回傳友善訊息 |
| playerIdentity 注入 Prompt | ✅ | 第二相體時注入特殊感知提示 |
| 對話持久化（chat_messages）| ✅ | Supabase 非同步寫入 |
| NPC 狀態持久化（npc_states）| ✅ | trust_level + clues_revealed |

### 指控與結局

| 功能 | 狀態 | 說明 |
|-----|------|------|
| 指控系統（三步驟）| ✅ | 選嫌疑人 → 選動機 → 確認 |
| 後端驗證（不在前端比對真相）| ✅ | `app/api/game/accuse/route.ts` |
| 分數計算（兇手 60 + 動機 40）| ✅ | |
| 結局頁面 | ✅ | 分數環、正確答案揭露 |
| 風味文字（WIN/LOSE 各 2–3 條）| ✅ | `lib/content/endings.ts` |
| 多結局分岔（8 條主線）| ❌ | 目前僅單一結局邏輯 |
| 沉默結局（第 10 幕回呼）| ❌ | 企劃書特殊結局 |
| 失控逃亡結局（Route B）| ❌ | EV 歸零觸發，尚未實裝 |
| 彩蛋第 11 幕「時光流逝」| ❌ | |

### 玩家路線系統

| 功能 | 狀態 | 說明 |
|-----|------|------|
| Route A（一般人）選項 | ✅ | |
| Route B（第二相體）選項 | ✅ | |
| Route B Prompt 感知注入 | ✅ | `buildRouteBConstraint()` + `playerIdentity` 注入 |
| EV 條 UI 顯示 | ✅ | 地圖頁狀態列顯示 EV 值和顏色條 |
| EV 值從對話行為累積 | ❌ | 目前固定為 0，未從對話事件計算 |
| SRR（理智保留率）| ❌ | 未實裝 |
| EV > 80 時選項消失 | ❌ | |
| 第二相體物種選擇 | ❌ | 情境問題判定（夜行性/嗅覺型等）|
| 費洛蒙掃描儀事件 | ❌ | |

### 難度系統

| 功能 | 狀態 | 說明 |
|-----|------|------|
| 4 個難度等級定義 | ✅ | `lib/content/difficulty.ts` |
| 難度寫入 DB | ✅ | `game_sessions.difficulty` |
| 難度影響 NPC Prompt（閃避率/說謊率）| ⚠️ | 定義完整，尚未注入 `buildNpcPrompt` |

### 幕次系統

| 功能 | 狀態 | 說明 |
|-----|------|------|
| 幕次地圖（Act 1–10）各 NPC 均定義 | ✅ | `actStateMap` |
| current_act DB 欄位 | ✅ | `game_sessions.current_act` |
| 地圖頁顯示「第 N 幕」| ✅ | |
| 幕次推進觸發條件 | ❌ | 尚未定義觸發規則 |
| 幕次過渡頁面 / 敘述文字 | ❌ | |

### 成就系統

| 功能 | 狀態 | 說明 |
|-----|------|------|
| 成就定義（26 條）| ✅ | `lib/content/achievements.ts`，5 類 |
| 成就列表頁面 | ✅ | `app/game/[sessionId]/achievements/page.tsx` |
| 隱藏成就解鎖前顯示「???」| ✅ | |
| 成就進度條 | ✅ | |
| 成就觸發邏輯 | ❌ | 定義完整，尚未在事件點埋入解鎖呼叫 |
| 企劃書要求 50+ 成就 | ⚠️ | 目前 26 條，框架可擴充 |

### 資料庫（Supabase）

| 功能 | 狀態 | 說明 |
|-----|------|------|
| game_sessions 表 | ✅ | killer_id, motive_direction, status, player_identity, difficulty, current_act |
| chat_messages 表 | ✅ | |
| npc_states 表 | ✅ | trust_level, clues_revealed |
| player_progress 表 | ✅ | |

### UI/UX

| 功能 | 狀態 | 說明 |
|-----|------|------|
| 暗色系主題（#0d1117 背景）| ✅ | |
| Noto Serif TC 字型 | ✅ | |
| 背景格子圖案 | ✅ | |
| 打字機效果（NPC 回覆 + 開場白）| ✅ | |
| NPC 對話氣泡（左/右分欄）| ✅ | |
| 信任度進度條 | ✅ | |
| 場景卡片 | ✅ | |
| 分數環動畫 | ✅ | |
| 地圖狀態列（難度/身份/EV/幕次）| ✅ | |
| 成就連結入口 | ✅ | |

---

## 二、本次 Session 新增的功能

### Task C — 開場流程（第一批）

| 新增 | 路徑 |
|-----|------|
| 5 段開場白文字 | `lib/content/prologue.ts` |
| 開場白頁面（分段打字機）| `app/game/[sessionId]/intro/page.tsx` |
| 身份選擇頁面 | `app/game/[sessionId]/identity/page.tsx` |
| 身份 API | `app/api/game/identity/route.ts` |
| NPC 引擎身份參數 | `lib/npc-engine.ts` — `playerIdentity` 欄位 |
| 路由導向更新 | `hooks/useGameSession.ts` — 開新局後進 `/intro` |
| 舊打字機開場移除 | `app/game/[sessionId]/page.tsx` |

### 功能審計補完（第二批）

| 新增 | 路徑 |
|-----|------|
| 難度定義（4 等級）| `lib/content/difficulty.ts` |
| 難度選擇頁面 | `app/game/[sessionId]/difficulty/page.tsx` |
| 難度 API | `app/api/game/difficulty/route.ts` |
| 成就定義（26 條）| `lib/content/achievements.ts` |
| 成就列表頁面 | `app/game/[sessionId]/achievements/page.tsx` |
| 地圖頁狀態列 | `app/game/[sessionId]/page.tsx` — 難度/身份/EV/幕次/成就 |
| DB 函式 | `lib/services/db.ts` — `updateDifficulty()` / `updateCurrentAct()` / `updatePlayerIdentity()` |
| Storage 鍵名 | `lib/constants.ts` — IDENTITY / DIFFICULTY / VISITED_SCENES / ACHIEVEMENTS |

---

## 三、完整遊戲開場路由

### 舊流程

```
/game → 點「開始新遊戲」→ /game/[sessionId]（地圖頁顯示 GAME_INTRO 打字機）
```

### 新流程

```
/game
  └─ 點「開始新遊戲」
       └─ /game/[sessionId]/intro       5 段開場白，逐段打字機，「繼續」/「略過全部」
            └─ /game/[sessionId]/identity    一般人 vs 第二相體，寫入 DB
                 └─ /game/[sessionId]/difficulty  4 個難度選擇，寫入 DB
                      └─ /game/[sessionId]         遊戲地圖（無開場動畫）
```

地圖頁頂部新增狀態列：

```
[劇情模式]  [一般人]  EV ●○○○○ 0   第 1 幕  ·  成就 →
```

---

## 四、仍待完成的項目

### 可純靠程式完成（無需設計文件）

| 優先 | 功能 | 說明 |
|-----|------|------|
| 高 | 成就觸發點 | 在 `accuse/route.ts`、`chat/route.ts`、scene 進入時埋入解鎖呼叫 |
| 高 | 難度注入 Prompt | 把 `difficulty` 傳入 `buildNpcPrompt`，高難度時提高 NPC 閃避率 |
| 高 | EV 累積邏輯 | 對話意圖偵測（攻擊性/暴露身份）觸發 `ev += N`，存入 localStorage + DB |
| 中 | 幕次推進 API | `PATCH /api/game/act`，達成條件後推進 `current_act` |
| 中 | 第二相體物種選擇頁 | 情境問題判定動物特質，影響 Route B 機制 |
| 低 | SRR 系統 UI | 理智保留率顯示 + 累積邏輯 |

### 需要內容設計確認後才能實作

| 功能 | 需要確認什麼 |
|-----|------------|
| 8 條主線分岔結局 | 各兇手（韓卓/余霜/鄭博/謝先生/白秋/莊河/林知夏/陶生）對應的不同結局文字 |
| 沉默結局 | 觸發條件（第 10 幕達成？線索不足？）和完整敘述 |
| 失控逃亡結局 | EV 歸零的觸發節點、文字、和遊戲結束邏輯 |
| 幕次過渡敘述 | 第 1 幕 → 第 2 幕銜接文字，以及觸發條件（線索數？特定 NPC 對話數？）|
| 企劃書要求 50+ 成就 | 目前 26 條，還需補充 24+ 條的名稱、描述、觸發條件 |
| 彩蛋第 11 幕 | 解鎖條件與完整文字內容 |

---

*報告由 Claude Sonnet 4.6 生成，2026-04-11*
