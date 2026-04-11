# E2E Bug Report — 2026-04-11

## 測試環境

- Dev server: `next dev --port 3099` (worktree CWD)
- Session A: `685fec06-e7a3-49c4-b7f2-88397f239a26` (Tests 1–3)
- Session B: `91ec5109-c5ba-4a10-a8e5-a9464a6bc29d` (Tests 4–13)

---

## 測試結果一覽

| # | 端點 | 方法 | 結果 | HTTP |
|---|------|------|------|------|
| 1 | `/api/game/new` | POST | PASS | 200 |
| 2 | `/api/game/identity` | PATCH | PASS | 200 |
| 3 | `/api/game/difficulty` | PATCH | PASS | 200 |
| 4 | `/api/chat` (chen_jie) | POST | PASS | 200 |
| 5 | `/api/chat` (zhengbo) | POST | PASS | 200 |
| 6 | `/api/chat` (guard) | POST | PASS | 200 |
| 7 | `/api/chat` (history GET) | GET | PASS | 200 |
| 8 | `/api/game/scene/interactions` | POST | PASS | 200 |
| 9 | `/api/game/clues` | GET | PASS | 200 |
| 10 | `/api/game/inventory` | GET | PASS | 200 |
| 11 | `/api/game/chat-log` | GET | PASS | 200 |
| 12 | `/api/game/action-points` | PATCH | PASS | 200 |
| 13 | `/api/game/accuse` | POST | PASS | 200 |

全部 13 項測試通過。

---

## 發現的問題

### BUG-01 — Dev server CWD 導致 Gemini 初始呼叫失敗（已解決，非程式碼問題）

**現象**: 首次啟動 dev server 時，若未 `cd` 到 worktree 目錄，`POST /api/chat` 會回傳 500。

**根本原因**: Next.js 以 `next dev` 的執行目錄（CWD）讀取 `.env.local`。若從其他目錄啟動，Google Generative AI SDK 初始化時讀不到 `GEMINI_API_KEY`，建立 `GoogleGenerativeAI` 實例時雖不拋錯，但後續呼叫時因 API key 為空字串而失敗。

**解法**: 確保 dev server 從 worktree 根目錄啟動：
```
cd /path/to/worktree && next dev --port 3099
```

**程式碼層面**: `lib/services/gemini.ts` 已有 early guard（`if (!process.env.GEMINI_API_KEY) throw`），但 `new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)` 仍在模組初始化時執行。當 CWD 正確時，此問題不會出現。

---

### BUG-02 — `/api/game/action-points` 參數名稱 vs 測試說明不符（文件問題，非程式碼 bug）

**現象**: 測試說明寫 `{ delta: -1 }`，但 API 實際接受 `{ actionPoints: number }`（絕對值而非增量）。

**根本原因**: API 設計為「傳入新的行動點數值」（absolute），不是「傳入差值」（delta）。前端以 localStorage 計算後直接 PATCH 最新值。

**解法**: 測試腳本使用正確欄位名：
```json
{ "sessionId": "...", "actionPoints": 8 }
```

程式碼無需修改。

---

### BUG-03 — `guard` NPC ID 命中 random NPC 快速路徑（預期行為確認）

**現象**: `guard` 不在 `lib/npc-registry.ts` 的具名 NPC 列表中，但 `/api/chat` 仍回傳 200。

**根本原因**: `isRandomNpc(npcId)` 會把所有不在固定列表的 ID 視為隨機路人 NPC，並用 `buildRandomNpcPrompt()` 產生通用提示。這是設計預期行為。

**動作**: 無需修改。

---

## 重要回傳範例

### Test 1 — 建立 session
```json
{
  "sessionId": "91ec5109-c5ba-4a10-a8e5-a9464a6bc29d",
  "motiveCount": 4,
  "suspectCount": 8,
  "seed": -1798076...,
  "generatedAt": "2026-04-11T12:45:47.928Z"
}
```

### Test 4 — NPC 對話（陳姐）
```json
{
  "reply": "來了啊？坐啊。\n\n要吃什麼？今天有牛肉麵，湯麵，還是老樣子？",
  "trustDelta": 10,
  "newTrustLevel": 10,
  "revealedClueId": null
}
```

### Test 13 — 指控結果
```json
{
  "correct": false,
  "killerCorrect": false,
  "motiveCorrect": false,
  "score": 0,
  "result": "lose",
  "answer": {
    "killerId": "taosheng",
    "motiveDirection": "C",
    "subMotiveId": "C2"
  },
  "newAchievements": [
    { "id": "first_accuse", "name": "第一次指控" },
    { "id": "wrong_person", "name": "沉默的共犯" }
  ]
}
```

---

## 結論

核心遊戲流程（開局 → 設定難度/身份 → 對話 NPC → 場景互動 → 查看線索/物品 → 指控）全部正常運作。Supabase 寫入讀取均正確。成就系統觸發正常。

先前修復的問題（`.env.local` 遺失、`truth_string` 欄位缺失、`sub_motive_id` 解析）均已生效，不再出現。
