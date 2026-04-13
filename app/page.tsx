import Link from "next/link";
import { HOMEPAGE_SUBTITLE_LINES } from "@/lib/content/narrative";

export default function Home() {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen px-6 overflow-hidden bg-[#0d1117]">

      {/* ── 背景格子（持續飄移）─────────────────────────────── */}
      <div className="absolute inset-0 bg-grid-animated opacity-70" aria-hidden="true" />

      {/* ── 掃描線 ────────────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="page-scanline" />
      </div>

      {/* ── 中心光暈 ─────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: "640px",
            height: "400px",
            background: "radial-gradient(ellipse, rgba(255,56,100,0.06) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: "480px",
            height: "320px",
            background: "radial-gradient(ellipse, rgba(91,184,255,0.04) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── 四角括號 ─────────────────────────────────────── */}
      {[
        "top-8 left-8 border-t border-l",
        "top-8 right-8 border-t border-r",
        "bottom-8 left-8 border-b border-l",
        "bottom-8 right-8 border-b border-r",
      ].map((cls, i) => (
        <div
          key={i}
          className={`absolute w-10 h-10 border-[#5bb8ff]/18 ${cls}`}
          aria-hidden="true"
        />
      ))}

      {/* ── 主要內容 ─────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center text-center">

        {/* 系統標籤 */}
        <div className="flex items-center gap-3 mb-10 animate-fade-in-slow opacity-0 delay-200">
          <span className="w-10 h-px bg-[#5bb8ff]/25" />
          <p className="font-mono-sys text-[10px] tracking-[0.45em] text-[#5bb8ff]/45 uppercase">
            P.E.&nbsp;02 &nbsp;/&nbsp; SAIDRIS &nbsp;/&nbsp; INCIDENT&nbsp;FILE
          </p>
          <span className="w-10 h-px bg-[#5bb8ff]/25" />
        </div>

        {/* 主標題 */}
        <div className="mb-2 opacity-0 animate-title-appear delay-300">
          <h1
            className="text-5xl md:text-7xl text-[#e2c9a0] glow-text-accent leading-tight"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif", letterSpacing: "0.2em" }}
          >
            相變世紀
          </h1>
        </div>

        {/* ZERO 標籤 */}
        <p
          className="text-xl tracking-[0.55em] text-[#ff3864] glow-text-accent mb-8 opacity-0 animate-fade-in delay-700"
          style={{ fontFamily: "var(--font-inter), sans-serif" }}
        >
          ZERO
        </p>

        {/* 橫線 */}
        <div className="flex items-center gap-4 mb-8 opacity-0 animate-fade-in delay-700">
          <span className="flex-1 h-px bg-gradient-to-r from-transparent to-[#e2c9a0]/15 w-24" />
          <span className="w-1 h-1 rounded-full bg-[#ff3864]/60" />
          <span className="flex-1 h-px bg-gradient-to-l from-transparent to-[#e2c9a0]/15 w-24" />
        </div>

        {/* 副標題 */}
        <p
          className="text-sm text-[#e2c9a0]/40 tracking-wide leading-[2.2] mb-12 max-w-xs opacity-0 animate-fade-in-up delay-700"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        >
          {HOMEPAGE_SUBTITLE_LINES[0]}
          <br />
          {HOMEPAGE_SUBTITLE_LINES[1]}
          <br />
          <span className="text-[#e2c9a0]/25">{HOMEPAGE_SUBTITLE_LINES[2]}</span>
        </p>

        {/* 按鈕組 */}
        <div className="flex flex-col gap-3 w-full max-w-xs opacity-0 animate-fade-in-up delay-1000">
          <Link
            href="/game"
            className="relative block w-full py-3.5 px-8 rounded border border-[#ff3864]/55 text-[#ff3864] text-sm tracking-widest hover:bg-[#ff3864]/10 hover:border-[#ff3864]/80 transition-all duration-300 glow-box-accent"
          >
            進入賽德里斯
          </Link>
          <Link
            href="/tutorial"
            className="block w-full py-3 px-8 rounded border border-[#5bb8ff]/12 text-[#5bb8ff]/35 text-sm tracking-widest hover:border-[#5bb8ff]/25 hover:text-[#5bb8ff]/60 transition-all duration-300"
          >
            新手教學
          </Link>
        </div>

        {/* 底部 meta */}
        <div className="mt-12 opacity-0 animate-fade-in-slow delay-1000">
          <p className="font-mono-sys text-[10px] text-[#e2c9a0]/12 tracking-[0.3em]">
            CASE NO. PEO2-0114 &nbsp;·&nbsp; SERIAL DISAPPEARANCE
          </p>
        </div>
      </div>
    </main>
  );
}
