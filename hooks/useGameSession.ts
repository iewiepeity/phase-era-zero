"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { STORAGE_KEYS } from "@/lib/constants";

/** 取得（或建立）訪客 ID，存入 localStorage */
function getGuestId(): string {
  const key = STORAGE_KEYS.GUEST_ID;
  let id    = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

interface UseGameSessionReturn {
  /** 是否正在請求 /api/game/new */
  starting:        boolean;
  /** 錯誤訊息（空字串表示無錯誤）*/
  error:           string;
  /** localStorage 中既有的 session ID（若有）*/
  existingSession: string | null;
  /** 元件是否已完成 hydration（避免 SSR 閃爍）*/
  mounted:         boolean;
  /** 開始新遊戲：呼叫 API → 導向地圖頁 */
  startNewGame:    () => Promise<void>;
}

/**
 * 遊戲 Session 管理 hook（大廳頁面用）。
 * 處理開新局 API 呼叫、localStorage 讀寫、路由導向。
 */
export function useGameSession(): UseGameSessionReturn {
  const router = useRouter();

  const [starting,        setStarting]        = useState(false);
  const [error,           setError]           = useState("");
  const [existingSession, setExistingSession] = useState<string | null>(null);
  const [mounted,         setMounted]         = useState(false);

  useEffect(() => {
    setMounted(true);
    const sid = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
    if (sid) setExistingSession(sid);
  }, []);

  async function startNewGame() {
    setStarting(true);
    setError("");
    try {
      const guestId = getGuestId();
      const res     = await fetch("/api/game/new", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ guestId }),
      });
      const data = await res.json();

      if (!res.ok || !data.sessionId) {
        setError("無法開始新遊戲，請稍後再試。");
        return;
      }

      // 清除舊局快照
      if (existingSession) {
        localStorage.removeItem(STORAGE_KEYS.RESULT(existingSession));
        localStorage.removeItem(STORAGE_KEYS.SEEN_INTRO(existingSession));
      }

      localStorage.setItem(STORAGE_KEYS.SESSION_ID, data.sessionId);
      router.push(`/game/${data.sessionId}/intro`);
    } catch {
      setError("連線失敗，請確認網路後重試。");
    } finally {
      setStarting(false);
    }
  }

  return { starting, error, existingSession, mounted, startNewGame };
}
