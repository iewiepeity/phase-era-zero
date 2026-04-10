# 遊戲引擎規格書 — build_npc_prompt()
**製作人**：謎子（GS-04）
**版本**：v1.0｜2026-04-10
**用途**：定義核心 Prompt 組裝函式的輸入 / 輸出規格，Phase 3 實作時磐石和織羽直接按這份來

> 這份是「規格書」，不是實作。實作在 Phase 3 的 `lib/game-engine.ts`。

---

## 函式簽名（TypeScript 版）

```typescript
function buildNpcPrompt(params: NpcPromptParams): string
```

---

## 輸入參數規格

```typescript
interface NpcPromptParams {
  npcId: string           // 必填，對應資料庫的 NPCs 表
  currentAct: number      // 必填，1–10，目前遊戲在第幾幕
  playerRoute: 'A' | 'B' // 必填，A=人類 B=第二相體
  playerStats: PlayerStats
  npcState: NpcState
  availableClues: Clue[]  // 這局這個 NPC 被允許透露的線索清單
  truthString: string     // 完整字串（只在後端用，絕不送前端）
}

interface PlayerStats {
  ev: number              // 0–100，獸性侵蝕值（Route B 才有意義）
  srr: number             // 0–100，理智保留率（Route B 才有意義）
  affinity: Record<string, number>  // { [npcId]: -100 到 +100 }
  collectedClues: string[]          // 玩家已取得的線索 ID 清單
  choiceHistory: string[]           // 玩家做過的重大選擇 ID 清單
}

interface NpcState {
  selfAffinity: number    // 這個 NPC 對玩家的好感度（-100 到 +100）
  sharedClues: string[]   // 這個 NPC 已經說出去的線索 ID（不重複說）
  isExposed: boolean      // 這個 NPC 是否已被玩家識破身份（適用兇手池成員）
  lastSeenAct: number     // NPC 上次出現是第幾幕（0 表示首次）
}

interface Clue {
  id: string              // 線索唯一 ID，例："clue_chen_jie_01"
  content: string         // 線索的自然語言描述（中文）
  triggerCondition: ClueCondition
  priority: 'critical' | 'major' | 'minor'
}

interface ClueCondition {
  minAffinity: number     // NPC 對玩家的最低好感度門檻（例：+20）
  requiredAct: number     // 最早可以透露的幕次（例：4 = 第四幕才說）
  behaviorTrigger?: string // 特殊行為觸發（例："fed_full_meal_and_thanked"）
  notBefore?: string[]    // 在這些線索被取得之前不能說（例：["clue_act4_main"]）
}
```

---

## 輸出規格

```typescript
// 回傳值是一個完整的 System Prompt 字串
// 由以下幾個區塊組成（按順序拼接）：

type NpcPromptOutput = string

// 組成結構（概念示意）：
// [角色基礎人設] + [當前幕次情境] + [可用線索清單] + [行為限制]
```

---

## 內部組裝邏輯（言知看這裡）

### 1. 載入角色基礎 Prompt
從 `prompts/[npcId]_v[version].md` 讀取基礎人設（不含線索部分）。

### 2. 注入當前情境
根據 `currentAct` 決定 NPC 當前的心理狀態：

```typescript
const actStateMap: Record<number, string> = {
  1: "城市還算平靜，你最近注意到一些奇怪的事，但沒有特別在意。",
  2: "那個失蹤的消息你聽說了，你有自己的判斷，但不打算說。",
  3: "警察最近常在附近晃，你謹慎了一些，話更少了。",
  4: "開始有人來問你，你知道的比他們想得多，但你也知道說太多的代價。",
  5: "你開始懷疑，失蹤的不只一個。但這個想法你壓著，不讓它出來。",
  6: "事情的規模讓你有點害怕，但你的臉上看不出來。",
  7: "你不確定誰在監視誰。你說話更謹慎了，每一句都想好了再說。",
  8: "你已經知道林淵的名字了，但那件事太重，你沒辦法輕易提起。",
  9: "城市亂起來了，你的麵館還開著，但你心裡清楚有些事快收不住了。",
  10: "不管最後怎麼走，你還是每天開門，每天擦桌子。"
}
```

### 3. 篩選可用線索
過濾 `availableClues`，只保留：
- `clue.triggerCondition.minAffinity <= npcState.selfAffinity`
- `clue.triggerCondition.requiredAct <= currentAct`
- `clue.id` 不在 `npcState.sharedClues` 裡（已說過的不重複）
- `notBefore` 的所有前置線索都在 `playerStats.collectedClues` 裡

### 4. 組裝線索指令區塊
```
你目前可以透露的資訊：

[如果有可用線索]
線索 A（優先級：critical）：{content}
觸發條件：{behaviorTrigger 的自然語言描述}

[如果沒有可用線索]
你現在還不適合透露任何資訊。不管玩家怎麼問，都找理由岔開。

重要規則：
- 一次對話最多透露一條線索
- 線索說出去後，不要重複說同樣的話
- 觸發條件沒達成時，你不知道有這條線索
```

### 5. 注入行為限制（根據 EV / SRR，Route B 限定）
```typescript
if (playerRoute === 'B') {
  if (playerStats.ev > 50) {
    appendToPrompt("玩家散發著你說不清楚的氣味，讓你有點不安。你說話謹慎了三分。")
  }
  if (playerStats.ev > 80) {
    appendToPrompt("玩家的狀態讓你看了不舒服，你想快點結束這次對話。")
  }
}
```

---

## 謎子的設計注意事項

**關於線索觸發的時序問題**：
玩家可能在同一幕裡多次和同一個 NPC 對話。`sharedClues` 的更新必須在「NPC 說出線索後立刻寫入 DB」，不能等到幕次結束，否則玩家可能同一局重複得到同一條線索。

**關於優先級（priority）的用法**：
- `critical`：這條線索是主線推進必須的，如果觸發條件達成就一定要說
- `major`：重要但非必須，如果對話時間短可以跳過
- `minor`：氛圍補充，只在玩家好感度極高時考慮說

**關於 `notBefore` 的設計原則**：
這是為了防止玩家跳過中間步驟直接得到結論。例如：陳姐說「那不是第一個失蹤的」這條線索，必須等玩家先從老許那邊得到「褪色的尋人啟示」之後才能說，否則玩家沒有辦法拼出完整的因果鏈。

---

*「設計的目的不是讓玩家全部走同一條路，而是讓每一條路都有它的邏輯。」— 謎子*
