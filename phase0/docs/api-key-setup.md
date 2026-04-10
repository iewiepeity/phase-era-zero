# API Key 安全設定指南
**製作人**：磐石（BE-03）
**版本**：v1.0｜2026-04-10
**適用對象**：所有在本機跑測試腳本的成員（Phase 0 主要是言知）

> ⚠️ 這份文件是整個專案的安全基礎。請在動第一行程式碼之前先讀完。

---

## 你需要申請的兩個 API Key

### 1. Google Gemini API Key
1. 前往 [Google AI Studio](https://aistudio.google.com/)
2. 登入 Google 帳號
3. 點右上角 **「Get API key」**
4. 建立新 key，複製起來（只會顯示一次）
5. 這個 key 命名為：`GEMINI_API_KEY`

### 2. Anthropic Claude API Key（備援用）
1. 前往 [Anthropic Console](https://console.anthropic.com/)
2. 建立帳號或登入
3. 左側選 **「API Keys」** → **「Create Key」**
4. 複製起來（只會顯示一次）
5. 這個 key 命名為：`ANTHROPIC_API_KEY`

---

## .env 檔案的設定方式

### 第一步：在你的 `phase0-prompt-test/` 資料夾下建立 `.env` 檔

```bash
# 在終端機執行（Mac）
cd phase0-prompt-test
touch .env
```

### 第二步：用文字編輯器打開 `.env`，填入以下內容

```
# Phase 0 測試用 API Keys
# 注意：這個檔案絕對不能傳上 GitHub

GEMINI_API_KEY=你的_Gemini_Key_貼在這裡
ANTHROPIC_API_KEY=你的_Anthropic_Key_貼在這裡
```

### 第三步：**立刻建立 `.gitignore`，把 `.env` 加進去**

```bash
touch .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo "__pycache__/" >> .gitignore
echo "*.pyc" >> .gitignore
```

**確認方式**：執行 `cat .gitignore`，應該看到 `.env` 在裡面。

---

## 在 Python 腳本裡讀取 Key

```python
# 每個測試腳本的開頭都要有這幾行
from dotenv import load_dotenv
import os

load_dotenv()  # 讀取 .env 檔案

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# 安全確認（每次執行都印這行，確認 key 有被讀到）
print(f"Gemini Key 前6碼：{GEMINI_API_KEY[:6]}...")
print(f"Anthropic Key 前6碼：{ANTHROPIC_API_KEY[:6]}...")
```

---

## 安裝需要的套件

```bash
pip install google-generativeai anthropic python-dotenv
```

如果出現版本衝突，用：
```bash
pip install google-generativeai anthropic python-dotenv --break-system-packages
```

---

## 磐石的三條鐵律

**第一條：.env 永遠不進 GitHub。** 如果你不小心 commit 了 .env，立刻告訴我，我們要 revoke key、換新的，然後用 `git filter-branch` 或 BFG 把那個 commit 的紀錄清掉。

**第二條：API Key 不貼在任何對話紀錄、截圖、文件裡。** 包括這個 Notion 頁面、Slack 訊息、Discord 截圖。Keys 只存在 .env 裡面。

**第三條：Key 不要硬編碼在程式碼裡。** 就算是測試腳本也不行。永遠用 `os.getenv()` 讀取。

```python
# ❌ 絕對不要這樣寫
GEMINI_API_KEY = "AIzaSy_你的Key..."

# ✅ 永遠這樣寫
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
```

---

## 確認環境正常的最小測試腳本

把這個存成 `test_connection.py`，跑一下確認兩個 Key 都通：

```python
from dotenv import load_dotenv
import os
import google.generativeai as genai
import anthropic

load_dotenv()

# 測試 Gemini
gemini_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=gemini_key)
gemini_model = genai.GenerativeModel("gemini-2.0-flash")
gemini_response = gemini_model.generate_content("用一句話介紹你自己，但你是賽德里斯的一個麵館老闆娘。")
print("=== Gemini 測試 ===")
print(gemini_response.text)

# 測試 Anthropic
anthropic_key = os.getenv("ANTHROPIC_API_KEY")
client = anthropic.Anthropic(api_key=anthropic_key)
claude_response = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=100,
    messages=[{"role": "user", "content": "用一句話介紹你自己，但你是賽德里斯的一個麵館老闆娘。"}]
)
print("\n=== Claude Haiku 測試 ===")
print(claude_response.content[0].text)
```

兩個都印出麵館老闆娘的回應 → 環境 OK，可以開始正式測試。

---

*「不安全的環境是所有後患的起點。這 30 分鐘值得。」— 磐石*
