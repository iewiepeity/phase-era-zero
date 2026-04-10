"use client";

import Link from "next/link";
import { useGameSession } from "@/hooks/useGameSession";

export default function GameLobbyPage() {
  const { starting, error, existingSession, mounted, startNewGame } = useGameSession();

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden bg-[#0d1117]">

      {/* 背景格子 */}
      <div className="absolute inset-0 bg-grid-static opacity-50" aria-hidden="true" />

      {/* 頂部細線 */}
      <div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff3864]/30 to-transparent"
        aria-hidden="true"
      />

      {/* 內容 */}
      <div
        className={`relative z-10 w-full max-w-sm transition-opacity duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}
      >
        {/* 返回首頁 */}
        <div className="flex justify-start mb-10">
          <Link
            href="/"
            className="font-mono-sys text-[10px] text-[#5bb8ff]/35 hover:text-[#5bb8ff]/65 tracking-widest transition-colors"
          >
            ← SAIDRIS.SYS
          </Link>
        </div>

        {/* 標題區塊 */}
        <div className="mb-10 corner-bracket p-6">
          <p className="font-mono-sys text-[10px] text-[#5bb8ff]/40 tracking-[0.4em] uppercase mb-4">
            案件資料庫　啟動
          </p>
          <h1
            className="text-3xl tracking-widest text-[#e2c9a0] mb-1 glow-text-accent"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            相變世紀　Zero
          </h1>
          <div className="h-px bg-gradient-to-r from-[#ff3864]/40 to-transparent mt-4 mb-5" />
          <p
            className="text-sm text-[#e2c9a0]/45 leading-[2.0]"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            十四人失蹤。你的名字出現在每一個人的通話紀錄裡。
            找出真正的兇手——在他們關上牢門之前。
          </p>
        </div>

        {/* 按鈕 */}
        <div className="flex flex-col gap-3">
          <button
            onClick={startNewGame}
            disabled={starting}
            className="w-full py-3.5 border border-[#ff3864]/55 text-[#ff3864] text-sm tracking-[0.2em] hover:bg-[#ff3864]/10 hover:border-[#ff3864]/80 active:bg-[#ff3864]/20 transition-all duration-300 disabled:opacity-40 rounded glow-box-accent"
          >
            {starting ? (
              <span className="font-mono-sys text-xs">INITIALIZING...</span>
            ) : (
              "開始新遊戲"
            )}
          </button>

          {existingSession && !starting && (
            <Link
              href={`/game/${existingSession}`}
              className="w-full py-3 border border-[#e2c9a0]/12 text-[#e2c9a0]/38 text-sm tracking-[0.2em] hover:border-[#e2c9a0]/28 hover:text-[#e2c9a0]/60 transition-all duration-300 rounded text-center"
            >
              繼續上次遊戲
            </Link>
          )}

          {error && (
            <p className="font-mono-sys text-[11px] text-[#ff3864]/65 text-center tracking-wide mt-1">
              {error}
            </p>
          )}
        </div>

        {/* 底部 */}
        <div className="mt-10 text-center">
          <p className="font-mono-sys text-[10px] text-[#e2c9a0]/12 tracking-[0.3em]">
            PHASE 5 COMPLETE
          </p>
        </div>
      </div>
    </main>
  );
}
