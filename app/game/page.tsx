"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function getGuestId(): string {
  const key = "pez_guest_id";
  let id = localStorage.getItem(key);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
  return id;
}

export default function GameLobbyPage() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [existingSession, setExistingSession] = useState<string | null>(null);

  useEffect(() => {
    const sid = localStorage.getItem("pez_game_session_id");
    if (sid) setExistingSession(sid);
  }, []);

  async function startNewGame() {
    setStarting(true);
    setError("");
    try {
      const guestId = getGuestId();
      const res = await fetch("/api/game/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId }),
      });
      const data = await res.json();
      if (!res.ok || !data.sessionId) {
        setError("無法開始新遊戲，請稍後再試。");
        return;
      }
      // 清除舊局結果
      if (existingSession) {
        localStorage.removeItem(`pez_result_${existingSession}`);
        localStorage.removeItem(`pez_seen_intro_${existingSession}`);
      }
      localStorage.setItem("pez_game_session_id", data.sessionId);
      router.push(`/game/${data.sessionId}`);
    } catch {
      setError("連線失敗，請確認網路後重試。");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* 標題 */}
      <div className="text-center mb-16 space-y-2">
        <p className="text-[10px] text-[#c9d6df]/25 tracking-[0.5em] uppercase mb-4">
          P.E. 02　賽德里斯
        </p>
        <h1
          className="text-5xl md:text-6xl tracking-widest text-[#c9d6df]"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        >
          相變世紀
        </h1>
        <p className="text-[#ff2e63] text-xl tracking-[0.4em]">ZERO</p>
      </div>

      {/* 簡介 */}
      <div className="max-w-sm text-center mb-14">
        <p
          className="text-sm text-[#c9d6df]/50 leading-[2] tracking-wide"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        >
          十四人失蹤。
          <br />
          你的名字出現在每一個人的通話紀錄裡。
          <br />
          找出真正的兇手——
          <br />
          在他們關上牢門之前。
        </p>
      </div>

      {/* 按鈕 */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={startNewGame}
          disabled={starting}
          className="w-full py-3 border border-[#ff2e63]/60 text-[#ff2e63] text-sm tracking-[0.2em] hover:bg-[#ff2e63]/10 active:bg-[#ff2e63]/20 transition-colors disabled:opacity-40 rounded"
        >
          {starting ? "開局中…" : "開始新遊戲"}
        </button>

        {existingSession && !starting && (
          <Link
            href={`/game/${existingSession}`}
            className="w-full py-3 border border-[#c9d6df]/15 text-[#c9d6df]/40 text-sm tracking-[0.2em] hover:border-[#c9d6df]/35 hover:text-[#c9d6df]/65 transition-colors rounded text-center"
          >
            繼續上次遊戲
          </Link>
        )}

        {error && (
          <p className="text-[11px] text-[#ff2e63]/70 text-center tracking-wide mt-1">
            {error}
          </p>
        )}
      </div>

      {/* 底部 */}
      <div className="absolute bottom-8 text-[10px] text-[#c9d6df]/12 tracking-[0.3em]">
        Phase 4　垂直切片
      </div>
    </div>
  );
}
