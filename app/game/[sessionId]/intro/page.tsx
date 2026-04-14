"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PROLOGUE_PARAGRAPHS, PROLOGUE_TOTAL } from "@/lib/content/prologue";
import { useTypewriter } from "@/hooks/useTypewriter";
import { INTRO_TYPING_MS } from "@/lib/constants";

/**
 * /game/[sessionId]/intro
 *
 * 開場固定敘事頁面。
 * 五段文字逐段打字機播放，每段結束後顯示「繼續」按鈕。
 * 全部播完後導向身份選擇頁。
 */
export default function IntroPage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;
  const router    = useRouter();

  // 如果已看過開場白，跳過
  useEffect(() => {
    const done = localStorage.getItem(`pez_seen_intro_${sessionId}`);
    if (done) router.replace(`/game/${sessionId}/identity`);
  }, [sessionId, router]);

  const [paraIndex, setParaIndex] = useState(0);
  const currentText = PROLOGUE_PARAGRAPHS[paraIndex] ?? "";

  const { displayed, isDone, skip } = useTypewriter({
    text:  currentText,
    speed: INTRO_TYPING_MS,
  });

  const isLastPara = paraIndex === PROLOGUE_TOTAL - 1;

  const handleContinue = useCallback(() => {
    if (!isDone) {
      // 先跳至段落末尾
      skip();
      return;
    }
    if (isLastPara) {
      try { localStorage.setItem(`pez_seen_intro_${sessionId}`, "1"); } catch {}
      router.push(`/game/${sessionId}/identity`);
    } else {
      setParaIndex((i) => i + 1);
    }
  }, [isDone, isLastPara, sessionId, skip, router]);

  const handleSkipAll = useCallback(() => {
    try { localStorage.setItem(`pez_seen_intro_${sessionId}`, "1"); } catch {}
    router.push(`/game/${sessionId}/identity`);
  }, [sessionId, router]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117]">
      {/* 掃描線背景 */}
      <div className="fixed inset-0 bg-grid-static opacity-40 pointer-events-none" aria-hidden="true" />
      {/* 頂部光線 */}
      <div
        className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#5bb8ff]/20 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 flex-1 flex flex-col max-w-xl mx-auto w-full px-6 pt-16 pb-12">

        {/* 進度指示器 */}
        <div className="flex items-center gap-1.5 mb-12">
          {PROLOGUE_PARAGRAPHS.map((_, i) => (
            <span
              key={i}
              className="h-px flex-1 transition-all duration-500"
              style={{
                background: i < paraIndex
                  ? "rgba(91,184,255,0.55)"
                  : i === paraIndex
                  ? "rgba(91,184,255,0.30)"
                  : "rgba(226,201,160,0.08)",
              }}
            />
          ))}
          <span className="font-mono-sys text-[9px] text-[#5bb8ff]/25 ml-2 tracking-widest">
            {paraIndex + 1}/{PROLOGUE_TOTAL}
          </span>
        </div>

        {/* 標籤 */}
        <div className="flex items-center gap-2 mb-8">
          <span className="font-mono-sys text-[10px] text-[#5bb8ff]/30 tracking-[0.4em] uppercase">
            PEO2 / INCIDENT BRIEF
          </span>
          <span className="flex-1 h-px bg-[#5bb8ff]/10" />
        </div>

        {/* 敘述文字 */}
        <div className="flex-1">
          <p
            className="text-sm leading-[2.2] text-[#e2c9a0]/80 whitespace-pre-wrap min-h-[12rem]"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            {displayed}
            {!isDone && <span className="typing-cursor" />}
          </p>
        </div>

        {/* 操作列 */}
        <div className="mt-12 flex items-center justify-between">
          {/* 略過全部 */}
          <button
            onClick={handleSkipAll}
            className="font-mono-sys text-[10px] text-[#e2c9a0]/18 hover:text-[#e2c9a0]/45 tracking-widest transition-colors"
          >
            略過全部 →
          </button>

          {/* 繼續 / 進入 */}
          {isDone && (
            <button
              onClick={handleContinue}
              className="px-8 py-3 border border-[#5bb8ff]/35 text-[#5bb8ff]/80 text-sm tracking-[0.25em] hover:bg-[#5bb8ff]/08 hover:border-[#5bb8ff]/60 hover:text-[#5bb8ff] transition-all duration-300 rounded animate-fade-in"
            >
              {isLastPara ? "開始調查" : "繼續"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
