# Phase 1 環境準備 Checklist
**製作人**：織羽（FE-02）
**版本**：v1.0｜2026-04-10
**用途**：Phase 0 結束後，W3 直接照這份清單把開發環境架好，不用猜步驟

> 假設你用的是 MacOS，且已經有磐石的 `.env` 設定基礎。

---

## 預計時間

照著這份清單走，沒遇到奇怪問題的話，全部完成大約 **6–8 小時**。

---

## Day 1 目標：Next.js 專案建立 + 推上 GitHub

### ☐ 安裝 Node.js 20+

```bash
# 先確認有沒有 Homebrew（Mac 的套件管理工具）
brew --version

# 如果沒有 Homebrew，先裝它：
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 有 Homebrew 之後，裝 Node.js
brew install node@20
node --version   # 應該看到 v20.x.x
npm --version    # 應該看到 10.x.x
```

### ☐ 建立 Next.js 專案

```bash
# 在你想放專案的地方執行（例如桌面或文件夾）
npx create-next-app@latest phase-era-zero --typescript --tailwind --app --src-dir --import-alias "@/*"
```

會有一連串問題，以下是推薦回答：
```
✔ Would you like to use ESLint? → Yes
✔ Would you like to use Tailwind CSS? → Yes（已含在指令裡）
✔ Would you like to use `src/` directory? → Yes
✔ Would you like to use App Router? → Yes
✔ Would you like to customize the default import alias? → No（直接 Enter）
```

建完後：
```bash
cd phase-era-zero
npm run dev   # 開啟開發伺服器
```

打開瀏覽器，進 `http://localhost:3000` → 看到 Next.js 預設首頁 ✅

### ☐ 安裝 shadcn/ui

```bash
# 確認你在 phase-era-zero 資料夾內
npx shadcn@latest init
```

問題回答：
```
Which style would you like to use? → Default
Which color would you like to use as base color? → Zinc（之後霓子會換，先用這個）
Would you like to use CSS variables? → Yes
```

安裝幾個基礎元件：
```bash
npx shadcn@latest add button card input scroll-area badge
```

### ☐ 建立 GitHub Repo 並第一次 push

```bash
# 在 phase-era-zero 資料夾內
git init
git add .
git commit -m "init: Next.js 14 + TypeScript + Tailwind + shadcn/ui"
```

然後：
1. 去 [github.com](https://github.com)，用 `iewiepeity` 帳號登入
2. 右上角 **「+」→「New repository」**
3. Repository name：`phase-era-zero`
4. 設為 **Private**（現在不公開）
5. **不要**勾選「Add a README file」（因為本機已經有了）
6. 點 **「Create repository」**
7. 照著 GitHub 頁面上「…or push an existing repository」的指令操作：

```bash
git remote add origin https://github.com/iewiepeity/phase-era-zero.git
git branch -M main
git push -u origin main
```

重新整理 GitHub 頁面 → 看到你的程式碼出現了 ✅

---

## Day 2 目標：Vercel 部署 + 看到線上網址

### ☐ 連接 Vercel

1. 去 [vercel.com](https://vercel.com)，用 GitHub 帳號登入
2. 點 **「Add New Project」**
3. 選 `iewiepeity/phase-era-zero`
4. Framework Preset 應該自動偵測到 Next.js
5. 點 **「Deploy」**
6. 等 1–2 分鐘 → 看到綠色 ✅ 和一個 `.vercel.app` 網址

你的遊戲有了第一個線上網址，雖然現在只有 Next.js 預設頁面。

### ☐ 設定自動部署

之後每次 `git push origin main`，Vercel 會自動重新部署。不需要額外設定，它已經在追蹤 `main` branch 了。

---

## Day 3 目標：Supabase 建立 + 環境變數串接

### ☐ 建立 Supabase 專案

1. 去 [supabase.com](https://supabase.com)，用 GitHub 帳號登入
2. 點 **「New project」**
3. Project name：`phase-era-zero`
4. Database Password：設一個強密碼並記下來（存在密碼管理器裡）
5. Region：選 **Northeast Asia (Tokyo)** — 離台灣最近
6. 點 **「Create new project」** → 等 1 分鐘

### ☐ 拿到 Supabase 的 Key

在 Supabase 專案頁面：
左側選 **「Settings」→「API」**

你需要以下兩個值：
- **Project URL**：長得像 `https://xxxxxxxxxxxx.supabase.co`
- **anon public key**：一串很長的 JWT

### ☐ 設定環境變數

**本機：** 在 `phase-era-zero` 資料夾建立 `.env.local`

```bash
touch .env.local
```

填入：
```
NEXT_PUBLIC_SUPABASE_URL=你的_Supabase_Project_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_Supabase_anon_key
```

**`.env.local` 也要加進 `.gitignore`！**
```bash
echo ".env.local" >> .gitignore
```

**Vercel 上的環境變數（線上版也要設定）：**
1. Vercel Dashboard → 選你的專案
2. 點 **「Settings」→「Environment Variables」**
3. 分別加入 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 重新部署（隨便 push 一個小改動就會觸發）

### ☐ 安裝 Supabase 相關套件

```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

## Day 4 目標：第一個 Supabase 資料表 + Auth 基礎

### ☐ 在 Supabase 建立 profiles 表

在 Supabase 左側選 **「SQL Editor」**，貼入以下 SQL 並執行：

```sql
-- 建立 profiles 表（儲存玩家基本資料）
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  created_at timestamptz default now()
);

-- 啟用 Row Level Security（RLS）— 磐石說沒 RLS 不准上線
alter table profiles enable row level security;

-- 設定 RLS 規則：每個玩家只能看自己的 profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);
```

### ☐ 在 Supabase 啟用 Email Auth

左側選 **「Authentication」→「Providers」**  
確認 **「Email」** 是啟用狀態（預設就是啟用的）

---

## Day 5 目標：寫登入頁 + 訪客試玩按鈕

這天開始寫程式碼。在 `src/app/` 建立以下結構：

```
src/
  app/
    page.tsx          ← 首頁（歡迎頁）
    login/
      page.tsx        ← 登入頁
    game/
      page.tsx        ← 遊戲主頁（現在只放一行文字）
```

**首頁 (`src/app/page.tsx`) 最簡單版：**

```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-8">
      <h1 className="text-4xl font-serif text-white">相變世紀：Zero</h1>
      <p className="text-zinc-400 text-center max-w-md">
        在第二相體剛被世界發現的年代，你被指控為連環失蹤案的兇手。
      </p>
      <div className="flex gap-4">
        <Button asChild variant="outline">
          <Link href="/login">登入</Link>
        </Button>
        <Button asChild>
          <Link href="/game">訪客試玩</Link>
        </Button>
      </div>
    </main>
  )
}
```

這樣就夠了。霓子 Phase 5 之前不會讓你碰美術，但至少頁面能跑起來。

---

## Day 6–7：整週收尾 + 確認清單

### ☐ 本機開發環境確認

```bash
npm run dev           # 能跑，http://localhost:3000 有東西
npm run build         # 能建置成功（沒有 TypeScript 錯誤）
npm run lint          # 沒有嚴重 warning
```

### ☐ 部署確認

打開你的 Vercel 網址 → 頁面能開 → 文字顯示正確

### ☐ README.md 寫好

```bash
cat > README.md << 'EOF'
# 相變世紀：Zero

互動推理網頁遊戲。

## 技術棧
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth + PostgreSQL)
- Gemini 2.5 Flash API

## 本機開發
1. Clone 這個 repo
2. 複製 `.env.local.example` 為 `.env.local`，填入 Supabase 和 AI API Keys
3. `npm install`
4. `npm run dev`

## 環境變數
見 `docs/api-key-setup.md`
EOF
```

---

## 常見卡關 & 解法

| 問題 | 解法 |
|---|---|
| `npx create-next-app` 執行很慢 | 等，網路問題，不是你的錯 |
| `npm run dev` 之後 localhost:3000 沒東西 | 等 5 秒，Next.js 第一次編譯很慢 |
| Vercel 部署失敗，看到紅色 | 點開 error log，通常是環境變數沒設或 TypeScript 有錯 |
| Supabase 連不上 | 確認 `.env.local` 的 URL 和 key 有沒有多空格 |
| shadcn 元件顯示樣式不對 | 確認 `tailwind.config.ts` 有包含 `components/ui` 路徑 |

---

*「環境設好了，後面的坑少一半。」— 織羽*
