# 相變世紀：Zero

> 賽德里斯，P.E. 02 年。十四人失蹤，你的名字出現在每一個人的通話紀錄裡。找出真正的兇手——在他們關上牢門之前。

AI 驅動的文字推理遊戲。與 NPC 建立信任、收集線索、指控兇手。

---

## 技術棧

| 層級 | 技術 |
|---|---|
| 框架 | Next.js 16.2.3（App Router）+ TypeScript |
| 樣式 | Tailwind CSS v4 |
| AI | Gemini 2.5 Flash（`@google/generative-ai`）|
| 資料庫 | Supabase（PostgreSQL + RLS）|
| 字型 | Noto Serif TC + JetBrains Mono |
| 部署 | Vercel（sin1 region）|

---

## 快速開始（本地開發）

### 1. 安裝相依套件

```bash
npm install
```

### 2. 設定環境變數

複製範例檔並填入真實值：

```bash
cp .env.example .env.local
```

`.env.local` 需要以下三個變數：

```env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

- Gemini API Key：[Google AI Studio](https://aistudio.google.com/app/apikey)
- Supabase 憑證：Supabase Dashboard → Project Settings → API

### 3. 啟動開發伺服器

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)

---

## 專案結構

```
相變世紀-Zero/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # GET 載入歷史 / POST 送訊息
│   │   └── game/
│   │       ├── new/route.ts       # POST 開新局
│   │       └── accuse/route.ts    # POST 提交指控
│   ├── game/
│   │   ├── page.tsx               # 遊戲大廳
│   │   └── [sessionId]/
│   │       ├── page.tsx           # 地圖 + 開場打字機
│   │       ├── chat/[npcId]/      # NPC 對話頁
│   │       ├── accuse/            # 三步驟指控
│   │       └── result/            # 結局揭曉
│   └── globals.css                # Plan A 配色 + 17 個動畫
│
├── components/
│   ├── ui/
│   │   ├── ScoreRing.tsx          # SVG 環形分數
│   │   └── TrustBar.tsx           # 信任度進度條
│   └── game/
│       ├── ChatBubble.tsx         # 對話氣泡
│       ├── SceneCard.tsx          # 場景選擇卡片
│       └── SuspectCard.tsx        # 嫌疑人卡片
│
├── hooks/
│   ├── useTypewriter.ts           # 打字機效果
│   ├── useGameSession.ts          # 開新局 / 繼續遊戲
│   └── useChat.ts                 # 對話完整狀態邏輯
│
├── lib/
│   ├── types.ts                   # 共用 TypeScript 型別
│   ├── constants.ts               # 顏色、鍵名、時間常數
│   ├── services/
│   │   ├── db.ts                  # Supabase CRUD
│   │   └── gemini.ts              # Gemini API 呼叫
│   ├── case-config.ts             # 8 嫌疑人 + 4 動機 + 兼容矩陣
│   ├── npc-engine.ts              # Prompt 組裝 + 信任度計算
│   ├── npc-registry.ts            # NPC 靜態定義（陳姐）
│   ├── random-engine.ts           # seed 隨機案件生成 + 動態線索
│   ├── scene-config.ts            # 場景定義
│   └── supabase.ts                # Supabase client 初始化
│
├── phase0/
│   ├── docs/                      # 技術文件、Prompt 規格書
│   ├── prompts/                   # NPC Prompt 版本紀錄
│   ├── planning/                  # 開發計劃、團隊名冊
│   └── test-chen-jie.mjs          # 陳姐 Phase 0 測試腳本
│
├── scripts/
│   ├── test-npc.ts                # NPC 單元測試
│   └── test-random-engine.ts      # 隨機引擎測試（200 次驗證）
│
├── .env.example                   # 環境變數範例
└── vercel.json                    # Vercel 部署設定
```

---

## API 端點

| 方法 | 路徑 | 說明 |
|---|---|---|
| `POST` | `/api/game/new` | 開新局，回傳 `sessionId` |
| `GET`  | `/api/chat` | 載入對話歷史與 NPC 狀態 |
| `POST` | `/api/chat` | 送出訊息，取得 Gemini 回覆 |
| `POST` | `/api/game/accuse` | 提交指控，回傳結局與正確答案 |

### POST /api/game/new

```json
// Request
{ "guestId": "uuid" }

// Response
{ "sessionId": "uuid", "motiveCount": 4, "suspectCount": 8, "seed": 12345 }
```

### POST /api/chat

```json
// Request
{
  "messages": [{ "role": "user", "content": "你好" }],
  "sessionId": "uuid",
  "npcId": "chen_jie"
}

// Response
{ "reply": "坐啊，要吃什麼？", "newTrustLevel": 10, "trustDelta": 5 }
```

### POST /api/game/accuse

```json
// Request
{ "sessionId": "uuid", "accusedKillerId": "hanzhuo", "accusedMotive": "B" }

// Response
{
  "correct": false,
  "killerCorrect": false,
  "motiveCorrect": false,
  "score": 0,
  "answer": { "killerId": "linzhixia", "motiveDirection": "D" }
}
```

---

## 部署到 Vercel

1. 在 [Vercel Dashboard](https://vercel.com) 匯入 GitHub repo `iewiepeity/phase-era-zero`
2. 在 Settings → Environment Variables 填入三個環境變數
3. 部署即完成，`vercel.json` 已設定 Singapore region 與 API cache 禁用

---

## 開發進度

| Phase | 說明 | 狀態 |
|---|---|---|
| Phase 0 | Gemini NPC 驗證（陳姐 5/5 通過）| ✅ 完成 |
| Phase 1 | Next.js + Supabase + 字型 + CI | ✅ 完成 |
| Phase 2 | 信任度系統 + 打字機 + 歷史持久化 | ✅ 完成 |
| Phase 3 | mulberry32 隨機引擎 + 9 合法對 + 動態線索 | ✅ 完成 |
| Phase 4 | 5 個路由：大廳 / 地圖 / 對話 / 指控 / 結局 | ✅ 完成 |
| Phase 5 | 掃描線 / 格子 / 光暈 / 動畫 / 部署配置 | ✅ 完成 |
| Phase 6 | 更多 NPC、更多場景、成就系統 | 🗂 BACKLOG |

---

## 遊戲機制

- **8 位嫌疑人 × 4 個動機方向** = 9 種合法兇手+動機組合（由兼容矩陣控制）
- **seed-based 隨機**：每局案件可重現，`forceKiller` / `forceMotive` 供除錯使用
- **信任度系統**：與 NPC 互動累積信任，解鎖不同線索（-100 ~ +100）
- **動態線索**：陳姐的線索根據本局兇手與動機動態生成
- **分數制**：兇手正確 60 分 + 動機正確 40 分 = 滿分 100

---

*「不是我們要做這個遊戲，是我們要陪緹緹做這個遊戲。」*
