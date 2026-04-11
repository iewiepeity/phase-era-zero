# BUG REPORT

> 測試日期：2026-04-11  
> 測試方式：`npm run dev` + `curl` 全端點覆蓋測試  
> 狀態：全部已修復並 commit

---

## B-01：POST /api/game/clues 在 offline / local session 模式回傳 `{ "clue": null }`

**嚴重程度：** 高  
**影響範圍：** `lib/services/db-clues.ts`、`app/api/game/clues/route.ts`

### 症狀

```
POST /api/game/clues
→ { "clue": null }
```

### 根因

`addPlayerClue()` 在兩種情況下回傳 `null`：

1. Supabase 未配置（`!isSupabaseConfigured()`）直接 `return null`
2. Supabase 已配置但 sessionId 為 `local_*` 格式（非合法 UUID），DB 拋出 `invalid input syntax for type uuid`，被 catch 後 `return null`

API route 直接把 `null` 回傳給前端，導致前端無法取得線索資料。

### 修復

**`lib/services/db-clues.ts`**：離線模式（Supabase 未配置）時，`addPlayerClue()` 改為返回本地構建的 `PlayerClue` 物件，不再回傳 `null`。

**`app/api/game/clues/route.ts`**：加入 fallback 邏輯——當 `addPlayerClue()` 仍回傳 `null`（例如 local UUID 插入失敗），以本地生成的線索物件回傳，確保回應永遠包含有效資料。

---

## B-02：POST /api/chat 當 `messages` 為空陣列或 `undefined` 時拋出 TypeError（HTTP 500）

**嚴重程度：** 高  
**影響範圍：** `app/api/chat/route.ts`

### 症狀

```
POST /api/chat  { "npcId": "chen_jie", "messages": [] }
→ HTTP 500  { "error": "server_error" }

伺服器日誌：
TypeError: Cannot read properties of undefined (reading 'content')
    at app/api/chat/route.ts:220
```

### 根因

handler 中未驗證 `messages` 是否為有效非空陣列，直接執行：

```ts
const history     = messages.slice(0, -1);       // messages 為 undefined 時崩潰
const lastMessage = messages[messages.length - 1]; // messages 為 [] 時 lastMessage = undefined
const reply       = await callGeminiChat(systemPrompt, history, lastMessage.content); // undefined.content → TypeError
```

### 修復

在 `npcId` 驗證之後立即加入 guard：

```ts
if (!Array.isArray(messages) || messages.length === 0) {
  return NextResponse.json({ error: "bad_request", message: "messages 不可為空" }, { status: 400 });
}
```

---

## B-03：`getCaseConfig()` 未查詢 `truth_string`，NPC 紅鯡魚線索永遠使用 seed=0

**嚴重程度：** 中  
**影響範圍：** `lib/services/db-game.ts`

### 症狀

所有遊戲局次的 NPC 紅鯡魚線索完全相同，不受實際隨機 seed 影響。

### 根因

`getCaseConfig()` 的 SELECT 查詢遺漏了 `truth_string`：

```ts
.select("killer_id, motive_direction, created_at")  // ← 缺少 truth_string
```

導致回傳的 `CaseConfig` 中 `subMotiveId`、`relationship`、`elements`、`truthString`、`seed` 全部為硬編碼預設值（`"A1"`、`"R1"`、`["D1"]`、`""`、`0`）。

`buildNpcClues()` 呼叫 `buildRedHerringClues()` 時使用 `config.seed % eligible.length || 0`，seed=0 讓所有局次選出相同的紅鯡魚線索，破壞了遊戲的隨機性。

### 修復

在 SELECT 加入 `truth_string`，並解析 `truth_string` 格式（`P{motive}{killerIdx}-{subMotive}-{mmdd}-{seed}-{relationship}-{elements}`）還原各欄位：

```ts
.select("killer_id, motive_direction, truth_string, created_at")

const truthParts   = (data.truth_string ?? "").split("-");
const subMotiveId  = (truthParts[1] as SubMotiveId | undefined) ?? "A1";
const seed         = parseInt(truthParts[3] ?? "0", 10) || 0;
const relationship = (truthParts[4] ?? "R1") as CaseConfig["relationship"];
const elements     = (elemStr.match(/D\d+/g) ?? ["D1"]) as CaseConfig["elements"];
```

---

## B-04：POST /api/game/scene/interactions 在 Act 2+ 跳過成就解鎖檢查

**嚴重程度：** 中  
**影響範圍：** `app/api/game/scene/interactions/route.ts`

### 症狀

玩家在第二幕（Act 2）探索場景時，互動觸發的成就永遠不會被解鎖，回應永遠包含 `"newAchievements": []`。

### 根因

成就解鎖檢查被包在 `if (currentAct < 2)` 區塊內：

```ts
if (currentAct < 2) {
  // 幕次推進...
  // 成就解鎖← 僅在 Act 1 執行
  return NextResponse.json({ ... });
}
// Act 2+ 直接回傳，跳過成就檢查
return NextResponse.json({ ok: true, discoveredClue, actProgression: null, newAchievements: [] });
```

### 修復

將資料載入（`getCollectedClueIds`、`getTalkedNpcs`）和成就解鎖檢查移到 `if (currentAct < 2)` 之外，幕次推進邏輯保留在 `if` 內：

```ts
// 永遠載入進度資料
const [clueIds, talkedNpcs] = await Promise.all([...]);

// 幕次推進僅在 Act 1
if (currentAct < 2) { ... }

// 成就解鎖：所有幕次皆執行
const newAchievements = checkAndUnlockAchievements({ ... }, alreadyUnlockedAchievements);

return NextResponse.json({ ok: true, discoveredClue, actProgression, newAchievements: [...] });
```

---

## 修復總覽

| Bug | 檔案 | 嚴重程度 | 狀態 |
|-----|------|----------|------|
| B-01 offline 線索回傳 null | `lib/services/db-clues.ts`<br>`app/api/game/clues/route.ts` | 高 | ✅ 已修復 |
| B-02 空 messages 導致 TypeError | `app/api/chat/route.ts` | 高 | ✅ 已修復 |
| B-03 getCaseConfig seed 恆為 0 | `lib/services/db-game.ts` | 中 | ✅ 已修復 |
| B-04 Act 2+ 跳過成就解鎖 | `app/api/game/scene/interactions/route.ts` | 中 | ✅ 已修復 |
