#!/bin/bash
# 相變世紀-Zero: 建置並推送 9 大功能更新
set -e

cd "$(dirname "$0")"

# 清除 git lock（如果存在）
rm -f .git/index.lock

# 加入所有新檔案
git add \
  lib/services/npc-events.ts \
  lib/services/time-system.ts \
  lib/services/event-system.ts \
  lib/services/audio.ts \
  lib/content/item-combinations.ts \
  lib/content/npc-conversations.ts \
  lib/content/game-events.ts \
  hooks/useAudio.ts \
  "app/game/[sessionId]/stats/page.tsx" \
  app/tutorial/page.tsx \
  "app/game/[sessionId]/page.tsx" \
  "app/game/[sessionId]/result/page.tsx" \
  "app/game/[sessionId]/scene/[sceneId]/page.tsx" \
  "app/game/[sessionId]/settings/page.tsx" \
  "app/game/[sessionId]/inventory/page.tsx" \
  app/page.tsx

echo "✅ git add 完成"

# 執行 build
echo "🔨 執行 npm run build..."
npm run build

echo "✅ build 成功"

# Commit + Push
git commit -m "feat: 新增 9 大遊戲功能

新增檔案：
- lib/services/npc-events.ts: NPC 主動事件系統
- lib/services/time-system.ts: 時間流動（4 時段）
- lib/content/item-combinations.ts: 道具組合定義
- lib/content/npc-conversations.ts: NPC 偷聽對話腳本
- lib/services/event-system.ts: 事件引擎
- lib/content/game-events.ts: 壓力/隨機事件定義
- app/game/[sessionId]/stats/page.tsx: 遊戲統計頁面
- lib/services/audio.ts + hooks/useAudio.ts: BGM 預留架構
- app/tutorial/page.tsx: 教學關卡

修改檔案：
- Hub 頁：時間顯示、NPC 事件通知、隨機事件通知
- 場景頁：偷聽觀察、使用道具按鈕、NPC 時段限制
- 道具頁：組合使用 UI
- 設定頁：BGM 音量滑桿、手動存檔
- 首頁：教學入口按鈕
- 結局頁：統計連結"

echo "✅ git commit 完成"

git push origin main

echo "✅ git push 完成！所有功能已上線。"
