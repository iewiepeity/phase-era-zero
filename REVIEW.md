# 相變世紀 Zero — 全面檢查報告

> 審查日期：2026-04-11
> 版本：Phase 0 / Next.js 16.2.3 + Gemini 2.5 Flash + Supabase

---

## 執行摘要

整體架構扎實，核心遊戲循環（開場 → 探索 → NPC 對話 → 線索收集 → 指控 → 結局）可完整跑通。
主要問題集中在「功能前端已做但後端/邏輯尚未接通」的斷點，以及幾個安全性疑慮。
無 runtime 崩潰性 bug（先前擔心的 `getCollectedClueIds` 確認已存在於 db.ts 第 801 行）。

---

## A. Bug / 必須修復

### A-1. 成就系統 localStorage key 不一致 ⭐ 簡單
**位置**：`app/game/[sessionId]/achievements/page.tsx:28`
```ts
// 頁面讀取的 key
localStorage.getItem(`pez_achievements_all`)

// 但 STORAGE_KEYS 中定義的是
STORAGE_KEYS.ACHIEVEMENTS = (sessionId) => `pez_achievements_${sessionId}`
```
任何地方若用 `STORAGE_KEYS.ACHIEVEMENTS` 寫入，成就頁永遠讀不到。兩邊需統一，建議統一為跨 session 共用的 `pez_achievements_all`（成就性質是跨局累積）並更新 `STORAGE_KEYS` 定義。

---

### A-2. 成就觸發邏輯服務不存在 ⭐⭐ 中等
**位置**：`lib/content/achievements.ts:5` 的頭部注解指向 `lib/services/achievements.ts`，但此檔案不存在。
目前沒有任何地方在遊戲事件發生時解鎖成就（通關、探索全部場景、信任度達標等），所有成就永遠顯示「未解鎖」。
`lib/content/achievements.ts` 中已定義 35 個成就的完整 `condition` 字串，需要撰寫對應的觸發服務並在以下位置接入：
- `app/api/game/accuse/route.ts`（通關相關成就）
- `app/api/game/scene/interactions/route.ts`（探索相關成就）
- `app/api/chat/route.ts`（對話信任相關成就）

---

### A-3. ActionPanel navigate 類型按鈕可能無反應 ⭐ 簡單
**位置**：`components/game/ActionPanel.tsx`，`handleOption` 函式
當 `navigate` 類型的 option 沒有提供 `npcId` 時，`if (opt.npcId && onNavigate)` 為 false，UI 顯示了按鈕，點了完全沒反應，沒有任何視覺回饋或警告。
修復：若 `npcId` 缺失，按鈕應 disabled 或不渲染。

---

### A-4. truth_string 子動機解析無容錯 ⭐ 簡單
**位置**：`app/api/game/accuse/route.ts`
```ts
const subMotiveId = truth_string.split('-')[1]  // 依賴固定格式
```
若 `truth_string` 格式在未來任何修改（random-engine、DB 欄位命名等），這裡會靜默返回 `undefined`，玩家的子動機永遠判定錯誤但不會有任何錯誤訊息。
修復：加上格式驗證和 fallback 日誌。

---

### A-5. completeGameSession 未 await，可能在 serverless 環境被截斷 ⭐ 簡單
**位置**：`app/api/game/accuse/route.ts`
```ts
completeGameSession(resolvedSessionId, ...)   // fire-and-forget
upsertPlayerProgress(resolvedSessionId, ...)  // fire-and-forget
```
Vercel Serverless 函式在 `NextResponse.json()` 後可能立即結束，導致通關記錄未寫入 DB。
修復：改為 `await Promise.all([completeGameSession(...), upsertPlayerProgress(...)])` 放在回應前。

---

## B. 體驗改善（優先級高）

### B-1. 難度選擇對遊戲完全無影響 ⭐⭐ 中等
**影響**：玩家花時間選難度卻無任何效果，信任感受損。
`npcEvasionRate`（0.0 / 0.3 / 0.6 / 0.9）和 `killerLieRate`（0 / 0 / 0.4 / 0.8）已在 `lib/content/difficulty.ts` 定義完整，但 `buildNpcPrompt` 從未接收或使用這些參數。
**修復方向**：
- 在 `app/api/chat/route.ts` 讀取 session 的 difficulty，傳入 `buildNpcPrompt`
- 在 system prompt 的 actState 段落注入：「本局難度：nightmare，你作為兇手時，謊言機率極高，可刻意混淆視聽。」
- 高難度時縮短 `conversationMemory` 的保留輪數（讓 NPC「記性更差」）

---

### B-2. Route B（第二相體）玩法與 Route A 無差異 ⭐⭐⭐ 困難
**影響**：這是遊戲的核心差異化設計，卻完全是視覺標籤，沒有任何功能差異。
`DEFAULT_PLAYER_STATS`（ev: 0, srr: 100）永遠被使用，EV 條 UI 在 hub 頁顯示但值永遠是 0。
**修復方向**：
- 在 DB 中追蹤 `ev_value`（每次 NPC 對話後，根據對話內容微調 +/- 1~3）
- 在 NPC prompt 注入 EV 值：「玩家是第二相體，EV 值 68，開始表現出不穩定的攻擊性」
- 高 EV 解鎖隱藏對話選項（對兇手可用強迫性追問）

---

### B-3. 線索合併的 Gemini prompt 沒有遊戲 context ⭐⭐ 中等
**位置**：`app/api/game/clues/combine/route.ts`
目前的 prompt 是通用的「請根據這些線索進行推理」，缺乏：
- 遊戲世界觀（賽德里斯、相變能力、P.R.O.C. 組織）
- 案件背景（14 人失蹤、22:40 時間點）
- 輸出格式規範（可能產生格式不一致的推理文字）
合併結果可能與遊戲敘事風格完全脫節。
**修復**：注入簡短的世界觀摘要和東野圭吾風格指示，規定輸出用繁體中文、150 字以內。

---

### B-4. 道具欄純展示，玩家不知道道具有何用途 ⭐ 簡單
**位置**：`app/game/[sessionId]/inventory/page.tsx`
道具卡片只顯示名稱和描述，沒有任何提示告訴玩家「這個道具可以在哪個場景或對話中使用」。
玩家持有「外套鈕扣」後不知道要去找誰談。
**修復**：在道具卡片加一行提示文字，例如「可帶去找 陳姐 詢問」或「在 警察局 出示可能有新線索」。

---

### B-5. 繼續上次遊戲無後端狀態驗證 ⭐⭐ 中等
**位置**：`app/game/page.tsx`
`existingSession` 只從 localStorage 讀取 sessionId，若該 session 在 DB 中已 `completed` 或 `abandoned`，玩家仍能進入並繼續對話，但指控頁會得到意外結果（因為 DB 邏輯認為已結束）。
**修復**：大廳頁在顯示「繼續上次遊戲」前，先 GET `/api/game/session?sessionId=xxx` 驗證狀態。

---

### B-6. 首次進入遊戲缺乏操作引導 ⭐⭐ 中等
完全沒有教程或功能說明。新玩家進入場景頁後不知道：
- ActionPanel（💡）是什麼
- 線索可以合併
- 信任度影響 NPC 回答深度
- 需要同時確定兇手、動機方向、子動機才能指控
**修復**：intro 頁結尾或第一次進入場景時，顯示 2-3 張快速說明卡（可關閉的 modal）。

---

### B-7. 線索頁「已合成線索」可選取但合成後無特別提示 ⭐ 簡單
`deduced` 類型的線索（已合成）在 UI 中不可被選取合併，但 UI 沒有任何說明，玩家可能誤以為線索功能壞了。
**修復**：已合成線索加上「已推理」標籤，並在線索頁頂部加一行說明：「選取 2-3 條原始線索可進行 AI 合併推理。」

---

### B-8. 場景頁「深入調查」按鈕永遠指向第一個 NPC ⭐ 簡單
**位置**：`app/game/[sessionId]/scene/[sceneId]/page.tsx:459`
```ts
router.push(`/game/${sessionId}/chat/${scene.npcs[0].id}`)
```
若場景有多個 NPC，永遠只導航到第一個。部分場景（如棄置倉庫）有 2 位 NPC，玩家無法快速進入第二位的對話。
**修復**：若場景有多個 NPC，改成顯示 NPC 選擇清單或移除此按鈕（因為 ActionPanel 和 item list 已有更好的導航方式）。

---

## C. 新功能建議

### C-1. 推理筆記本（偵探手冊）⭐⭐ 中等 — 核心功能
玩家可以在任何頁面開啟一個側邊欄筆記本，手動記錄自己的推理過程：
「我認為 陳姐 撒謊，因為她說 22:40 在麵館，但倉庫紀錄顯示...」
這是推理遊戲的標誌性功能，大幅提升推理深度和沉浸感。
- **實作**：localStorage 存儲純文字，`/game/[sessionId]/notes` 頁面，各頁面右下角浮動筆記按鈕
- **進階**：允許把某條線索「釘」進筆記（`/clues` 頁的 pin 按鈕）

---

### C-2. NPC 時間線索系統 ⭐⭐⭐ 困難 — 沉浸感
某些 NPC 只在「特定時間段」出現在特定場景（遊戲內時間，例如第 1-5 次對話為白天，第 6-10 次為深夜），對話會有不同的回應。
例如：鄭伯在辦公室白天態度冷漠，深夜造訪時可能露出破綻。
- **實作**：`conversation_count` 決定時間段，在 system prompt 注入「現在是夜間，{NPC名} 剛結束一天的工作，防備較低」

---

### C-3. 結局後的 NPC 反應對話 ⭐⭐ 中等 — 敘事品質
遊戲結束（win/lose）後，在結果頁顯示「真兇的最後一句話」和「一個相關 NPC 的反應」。
例如 win 時：「陳姐沉默了很久，然後說：『我知道你最後一定會找到的。』」
- **實作**：`lib/content/endings.ts` 擴充，每個兇手有一段 3-5 行的「被捕後陳述」；結果頁 phaseIdx 4 顯示

---

### C-4. 跨局成就實裝 ⭐⭐ 中等 — 重玩性
觸發目前已定義的 35 個成就（最快破案、全場景探索、信任度 100 等），在結果頁顯示「本局解鎖成就」。
- **實作**：參見 A-2 的服務層方向，成就跨 session 累積（存 `pez_achievements_all`）

---

### C-5. 推理分享卡 ⭐⭐ 中等 — 社交功能
結果頁生成一張可截圖的「推理分享卡」，包含：
- 案件代號（隨機生成的黑色格調卡片）
- 你的答案 vs 正確答案
- 分數 + 評語（例如「星際級偵探」）
- 遊戲連結
- **實作**：`html2canvas` 或 CSS `@media print` 截圖，或用 `/api/og` 生成 OG 圖片

---

### C-6. 計時挑戰模式 ⭐⭐ 中等 — 重玩性
限時 20 分鐘找出兇手。計時器顯示在 hub 頁頂部（可選擇是否開啟）。
時間到自動進入指控頁，強迫玩家作答。分數有時間加成（越快越高分）。
- **實作**：localStorage 記錄 `pez_start_time_${sessionId}`，hub 頁計算剩餘時間顯示

---

### C-7. 連續推理模式（Series Mode）⭐⭐⭐ 困難 — 重玩性
同一世界觀、三個連續案件，第一局的某條線索會影響第二局的初始條件。
例如第一局找出 P.R.O.C. 組織後，第二局開始時多位 NPC 的初始信任度改變。
- **實作**：`player_progress` 表儲存跨局解鎖的「世界知識」，下一局 `buildNpcPrompt` 讀取注入

---

### C-8. 主角名字自訂 + 代入感提升 ⭐ 簡單 — 個人化
開局時讓玩家輸入名字，NPC 可在特定場合稱呼玩家（「所以，[玩家名]，你認為呢？」）。
目前 NPC 只說「你」，有名字後沉浸感大幅提升。
- **實作**：intro 頁新增一步輸入名字，存入 localStorage 和 DB，注入 system prompt「玩家的名字是 [名字]，NPC 偶爾以名字稱呼」

---

### C-9. 隱藏結局：揭露 P.R.O.C. ⭐⭐⭐ 困難 — 敘事深度
若玩家在指控前：
1. 對每個 NPC 信任度都達到 50+
2. 蒐集了全部 P.R.O.C. 相關線索
3. 訪問過全部 10 個場景

觸發隱藏結局：真正的幕後組織 P.R.O.C. 浮出水面，揭示失蹤事件不只是個人動機，而是系統性計畫的一環。
- **實作**：`accuse/route.ts` 在計算分數前，檢查是否符合隱藏結局條件，返回特殊 `result: "hidden_ending"` 類型

---

## D. 技術債務

### D-1. clues/combine 未使用服務層 ⭐ 簡單
**位置**：`app/api/game/clues/combine/route.ts`
自己直接 `new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)` 並 hardcode 模型名稱，與 `lib/services/gemini.ts` 重複，若模型版本升級需要改兩個地方。
**修復**：將合成邏輯提取成 `lib/services/gemini.ts` 中的 `callGeminiCombine(clueTexts: string[])` 函式。

---

### D-2. 所有 API 無授權驗證 ⭐⭐ 中等
任何人只要知道有效的 `sessionId` 字串，就能呼叫所有 PATCH/POST endpoint 修改遊戲狀態。
這是共享遊戲環境的設計限制，但至少需要：
- `sessionId` 格式驗證（regex 檢查長度和字元）
- `/api/game/new` 的 `forceKiller`/`forceMotive` 參數應加 `process.env.ADMIN_TOKEN` 保護或直接移除

---

### D-3. GEMINI_API_KEY 非空斷言 ⭐ 簡單
**位置**：`lib/services/gemini.ts`、`app/api/game/clues/combine/route.ts`
```ts
new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)  // 若未設定，runtime 崩潰
```
**修復**：
```ts
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
```

---

### D-4. Gemini API 無速率限制保護 ⭐⭐ 中等
`/api/chat` 和 `/api/game/clues/combine` 都沒有任何 rate limiting。
惡意用戶可無限呼叫消耗 quota。
**修復**：使用 Vercel 的 `@vercel/kv` 或 Supabase 的 `redis` 做基礎的 IP + sessionId rate limit（每分鐘 30 次對話，每小時 10 次合成）。

---

### D-5. DEFAULT_PLAYER_STATS 應從 DB 動態讀取 ⭐⭐ 中等
**位置**：`app/api/chat/route.ts`、`lib/npc-engine.ts`
```ts
playerStats: DEFAULT_PLAYER_STATS  // ev: 0, srr: 100 永遠固定
```
若要實現 Route B 差異和難度系統，`ev`、`srr` 需要從 DB 的 session 記錄讀取。這是 B-2 功能的前置技術工作。

---

### D-6. updateNpcState 讀-改-寫無原子性 ⭐ 簡單
**位置**：`lib/services/db.ts`
```ts
// SELECT → 計算新值 → UPDATE，兩次同時觸發時信任度可能計算錯誤
const current = await getNpcState(...)
await upsert({ selfAffinity: current + delta })
```
**修復**：改用 Supabase RPC 或 `UPDATE npc_states SET self_affinity = self_affinity + $delta WHERE ...` 的原子加法。

---

### D-7. params.sessionId as string 全局無驗證 ⭐ 簡單
所有 `page.tsx` 中的 `const sessionId = params.sessionId as string` 均無邊界情況保護。
若用戶手動輸入畸形 URL（如 `/game//scene/xxx`），`sessionId` 為空字串，後續所有 API 呼叫帶空字串，行為未定義。
**修復**：在所有使用 sessionId 的頁面頂部加：
```ts
if (!sessionId) { router.replace('/game'); return; }
```

---

### D-8. 難度系統的 nightmare 特殊處理邏輯分散 ⭐ 簡單
**位置**：`app/api/game/difficulty/route.ts`
```ts
// nightmare 存入 DB 時改存 "hard"
const dbDifficulty = difficulty === "nightmare" ? "hard" : difficulty
```
而前端讀取時又從 localStorage 拿完整的 `"nightmare"` 字串，兩邊定義不一致，未來任何地方需要從 DB 判斷是否 nightmare 都會失敗。
**修復**：DB 儲存原始值 `"nightmare"`，或在 `DifficultyId` 型別加 comment 說明此設計意圖。

---

## 優先修復建議順序

| 優先級 | 項目 | 原因 |
|--------|------|------|
| 🔴 P1 | A-5 completeGameSession 加 await | 通關記錄可能不寫入 |
| 🔴 P1 | A-2 成就觸發服務 | 核心功能斷點，玩家無任何成就獎勵 |
| 🔴 P1 | B-1 難度注入 NPC prompt | 難度選擇完全無效，玩家選了沒意義 |
| 🟠 P2 | A-1 成就 key 統一 | 影響所有成就顯示 |
| 🟠 P2 | B-6 首次引導 | 新玩家流失率高 |
| 🟠 P2 | B-3 線索合併 prompt 加 context | 合成結果品質問題 |
| 🟡 P3 | C-1 推理筆記本 | 核心沉浸感功能 |
| 🟡 P3 | C-3 結局後 NPC 反應 | 敘事收尾感 |
| 🟡 P3 | D-4 速率限制 | API quota 保護 |
| 🟢 P4 | C-5 推理分享卡 | 社交傳播 |
| 🟢 P4 | C-8 主角名字 | 個人化沉浸感 |
| 🟢 P4 | B-2 Route B EV 系統 | 大工程，第二階段再做 |
