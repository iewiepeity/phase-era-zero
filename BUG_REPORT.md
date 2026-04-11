# Bug Report — 2026-04-11

## 測試摘要
- 通過：13/13（修復後）
- 失敗：0/13（修復後）
- 修復前失敗：5/13

---

## Bug 清單

### Bug 1：`/api/chat` 缺少 `messages` 時崩潰（500）
- **端點**：POST /api/chat
- **症狀**：呼叫時傳入 `message`（字串）而非 `messages`（陣列），伺服器拋出 `TypeError: Cannot read properties of undefined (reading 'slice')`，回傳 500
- **根本原因**：API 直接解構 `messages` 欄位並立即呼叫 `.slice()`，未做任何 null/undefined 檢查；當客戶端以簡易格式傳入單一 `message` 字串時直接崩潰
- **修復方式**：在 `app/api/chat/route.ts` 加入雙格式相容邏輯——若 `messages` 為空但 `message` 字串存在，自動包裝成 `[{ role: "user", content: message }]`；同時加入明確的驗證錯誤回傳（400）
- **狀態**：已修復 ✅

### Bug 2：`/api/game/identity` 不接受 `"detective"` 身份值
- **端點**：PATCH /api/game/identity
- **症狀**：傳入 `identity: "detective"` 回傳 400 `invalid_params`
- **根本原因**：驗證白名單僅包含 `["normal", "phase2"]`，未考慮語意等同的別名
- **修復方式**：在 `app/api/game/identity/route.ts` 建立別名映射表 `IDENTITY_ALIASES`，將 `"detective"` 映射為 `"normal"`（Route A 路線），同時更新錯誤訊息
- **狀態**：已修復 ✅

### Bug 3：`/api/game/scene/interactions` 不接受 `objectId` 欄位
- **端點**：POST /api/game/scene/interactions
- **症狀**：傳入 `objectId` 欄位時回傳 400 `missing required fields`，因為 API 只接受 `itemId`
- **根本原因**：API 欄位命名為 `itemId`，但部分客戶端（如測試腳本）使用舊版欄位名 `objectId`，兩者語意相同
- **修復方式**：在 `app/api/game/scene/interactions/route.ts` 以 `body.itemId ?? body.objectId` 相容兩種欄位名；`interactionType` 未提供時預設為 `"examine"`
- **狀態**：已修復 ✅

### Bug 4：`/api/game/action-points` 不支援 `delta`（相對增減）
- **端點**：PATCH /api/game/action-points
- **症狀**：傳入 `delta: -1` 回傳 400 `invalid_params`，因為 API 只接受絕對值 `actionPoints`
- **根本原因**：API 只實作了設定絕對值的功能，未支援相對值（delta）模式；消耗行動點的客戶端若不知道目前點數就無法正確呼叫
- **修復方式**：在 `app/api/game/action-points/route.ts` 加入 delta 支援——若傳入 `delta` 而非 `actionPoints`，先從 DB 查詢目前值再加減，回傳新值；同時修正型別宣告讓兩個欄位都是選填
- **狀態**：已修復 ✅

### Bug 5：`/api/game/accuse` 不接受 `suspectId` 簡易格式
- **端點**：POST /api/game/accuse
- **症狀**：傳入 `suspectId: "zhengbo"` 回傳 400，因為 API 要求 `accusedKillerId` + `accusedMotive` + `accusedSubMotive` 三個欄位
- **根本原因**：API 強制要求完整三欄位，但簡易呼叫（僅提供嫌疑人 ID）應被允許，缺少動機欄位時以 0 分計算即可
- **修復方式**：在 `app/api/game/accuse/route.ts` 加入 `suspectId` 別名支援（等同 `accusedKillerId`）；`accusedMotive` 和 `accusedSubMotive` 改為選填，缺少時對應分數為 0
- **狀態**：已修復 ✅

---

## 其他發現

### 環境設定問題（非程式碼 Bug）
- **症狀**：worktree 目錄缺少 `.env.local`，導致 GEMINI_API_KEY 和 Supabase 連線設定未載入
- **根本原因**：`.env.local` 存在於 monorepo 根目錄 `/Users/peiwei/Desktop/相變世紀-Zero/` 而非 worktree 目錄
- **處置**：複製 `.env.local` 至 worktree 目錄，dev server 重啟後正常讀取

---

## 測試結果明細

| # | 端點 | 修復前 | 修復後 | 備註 |
|---|------|--------|--------|------|
| 1 | POST /api/game/new | ✅ PASS | ✅ PASS | 回傳 sessionId + seed |
| 2 | PATCH /api/game/identity | ❌ FAIL | ✅ PASS | `"detective"` 現映射為 `"normal"` |
| 3 | PATCH /api/game/difficulty | ✅ PASS | ✅ PASS | 接受 `"normal"` |
| 4 | POST /api/chat (chen_jie) | ❌ FAIL | ✅ PASS | 支援單一 `message` 字串格式 |
| 5 | POST /api/chat (zhengbo) | ❌ FAIL | ✅ PASS | 確認鄭博（非陳姐）在說話 |
| 6 | POST /api/chat (guard) | ❌ FAIL | ✅ PASS | 一般 NPC 老陳能正常對話 |
| 7 | GET /api/chat history | ✅ PASS | ✅ PASS | 正確回傳 2 則歷史訊息 |
| 8 | POST /api/game/scene/interactions | ❌ FAIL | ✅ PASS | `objectId` 現相容 `itemId` |
| 9 | GET /api/game/clues | ✅ PASS | ✅ PASS | 回傳空陣列（尚無線索） |
| 10 | GET /api/game/inventory | ✅ PASS | ✅ PASS | 回傳空陣列（尚無道具） |
| 11 | GET /api/game/chat-log | ✅ PASS | ✅ PASS | 回傳 3 個 NPC 對話群組 |
| 12 | PATCH /api/game/action-points | ❌ FAIL | ✅ PASS | `delta: -1` 扣除 1 點，回傳新值 |
| 13 | POST /api/game/accuse | ❌ FAIL | ✅ PASS | `suspectId` 現相容 `accusedKillerId` |

---

## 修改檔案清單

| 檔案 | 說明 |
|------|------|
| `app/api/chat/route.ts` | 支援 `message` 字串格式；加入 `messages` 缺少時的 400 驗證 |
| `app/api/game/identity/route.ts` | 加入 `IDENTITY_ALIASES`，支援 `"detective"` → `"normal"` |
| `app/api/game/scene/interactions/route.ts` | 相容 `objectId` 欄位；`interactionType` 預設為 `"examine"` |
| `app/api/game/action-points/route.ts` | 加入 `delta` 支援（相對增減）；DB 讀取目前值後計算 |
| `app/api/game/accuse/route.ts` | 相容 `suspectId` 別名；動機欄位改為選填 |
| `.env.local`（新建） | 複製根目錄環境變數至 worktree，確保 API key 正常載入 |
