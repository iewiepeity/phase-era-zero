"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SUSPECTS, MOTIVES, SUB_MOTIVES } from "@/lib/case-config";
import { STORAGE_KEYS } from "@/lib/constants";
import { ScoreRing } from "@/components/ui/ScoreRing";
import type { KillerId, MotiveDirection, SubMotiveId } from "@/lib/case-config";

interface AccuseResult {
  correct:          boolean;
  killerCorrect:    boolean;
  motiveCorrect:    boolean;
  subMotiveCorrect: boolean;
  score:            number;
  result:           "win" | "lose";
  answer:           { killerId: KillerId; motiveDirection: MotiveDirection; subMotiveId: SubMotiveId | null };
}

// ── 複製工具 ──────────────────────────────────────────────────
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 降級：建立暫存 textarea
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity  = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      return true;
    } finally {
      document.body.removeChild(ta);
    }
  }
}

// ── 分享文字產生 ──────────────────────────────────────────────
function buildShareText(result: AccuseResult, sessionId: string): string {
  const { correct, score, answer } = result;
  const killer = SUSPECTS[answer.killerId];
  const motive = MOTIVES[answer.motiveDirection];
  const sub    = answer.subMotiveId ? SUB_MOTIVES[answer.subMotiveId] : null;

  const stars = score >= 90 ? "★★★" : score >= 60 ? "★★☆" : score >= 30 ? "★☆☆" : "☆☆☆";

  const lines = [
    "【相變世紀 — 第十四號失蹤案】",
    "",
    correct ? "✓ 案件告破" : "✗ 真相仍在黑暗中",
    `得分：${score} / 100　${stars}`,
    "",
    `兇手：${killer.name}　${correct ? "✓" : "✗"}`,
    `動機：${motive.name}（${answer.motiveDirection}）　${result.motiveCorrect ? "✓" : "✗"}`,
    sub ? `子動機：${sub.name}　${result.subMotiveCorrect ? "✓" : "✗"}` : "",
    "",
    "在賽德里斯，每一個失蹤都不是意外。",
    `Session: ${sessionId.slice(0, 8).toUpperCase()}`,
  ].filter((l) => l !== null);

  return lines.join("\n");
}

// ── 主元件 ───────────────────────────────────────────────────
export default function SharePage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;

  const [result,      setResult]      = useState<AccuseResult | null>(null);
  const [copied,      setCopied]      = useState(false);
  const [ringAnimate, setRingAnimate] = useState(false);
  const [mounted,     setMounted]     = useState(false);

  useEffect(() => {
    setMounted(true);
    const raw = localStorage.getItem(STORAGE_KEYS.RESULT(sessionId));
    if (!raw) return;
    try {
      setResult(JSON.parse(raw) as AccuseResult);
      setTimeout(() => setRingAnimate(true), 400);
    } catch { /* ignore */ }
  }, [sessionId]);

  async function handleCopy() {
    if (!result) return;
    const text = buildShareText(result, sessionId);
    const ok   = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  if (!mounted) return null;

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#0d1117]">
        <p
          className="text-sm text-[#e2c9a0]/35 mb-6"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        >
          尚未完成遊戲，或資料已遺失。
        </p>
        <Link
          href={`/game/${sessionId}`}
          className="font-mono-sys text-[11px] text-[#e2c9a0]/30 hover:text-[#e2c9a0]/60 tracking-widest transition-colors border border-[#e2c9a0]/10 px-4 py-2 rounded"
        >
          返回調查
        </Link>
      </div>
    );
  }

  const { correct, score, killerCorrect, motiveCorrect, subMotiveCorrect, answer } = result;
  const correctKiller = SUSPECTS[answer.killerId];
  const correctMotive = MOTIVES[answer.motiveDirection];

  const stars     = score >= 90 ? "★★★" : score >= 60 ? "★★☆" : score >= 30 ? "★☆☆" : "☆☆☆";
  const accentClr = correct ? "#ff3864" : "rgba(226,201,160,0.55)";

  return (
    <div className="min-h-screen flex flex-col max-w-sm mx-auto bg-[#0d1117]">
      <div className="fixed inset-0 bg-grid-static opacity-20 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* 標題列 */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-[#e2c9a0]/6">
          <Link
            href={`/game/${sessionId}/result`}
            className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/60 tracking-widest transition-colors"
          >
            ← 結果
          </Link>
          <p className="font-mono-sys text-[10px] text-[#5bb8ff]/40 tracking-[0.4em] uppercase">
            分享成績
          </p>
          <div className="w-12" />
        </header>

        <div className="flex-1 flex flex-col items-center px-5 py-8 gap-6">

          {/* 成績卡片 */}
          <div
            className="w-full rounded-xl border p-6 space-y-5 animate-fade-in"
            style={{
              background:   "rgba(13,17,23,0.95)",
              borderColor:  `${accentClr}22`,
              boxShadow:    `0 0 40px ${accentClr}08`,
            }}
          >
            {/* 頂部標籤 */}
            <div className="text-center space-y-1">
              <p className="font-mono-sys text-[8px] text-[#5bb8ff]/35 tracking-[0.5em] uppercase">
                PHASE ZERO · CASE #14
              </p>
              <p
                className="text-lg tracking-widest"
                style={{ color: accentClr, fontFamily: "var(--font-noto-serif-tc), serif" }}
              >
                {correct ? "案件告破" : "真相未明"}
              </p>
            </div>

            {/* 分數環 */}
            <div className="flex justify-center">
              <ScoreRing score={score} animate={ringAnimate} />
            </div>

            {/* 星級 */}
            <p
              className="text-center text-2xl tracking-widest"
              style={{ color: accentClr }}
            >
              {stars}
            </p>

            <div className="h-px bg-gradient-to-r from-transparent via-[#e2c9a0]/08 to-transparent" />

            {/* 答案摘要 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className="text-xs text-[#e2c9a0]/40"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  兇手
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-sm text-[#e2c9a0]/75"
                    style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                  >
                    {correctKiller.name}
                  </span>
                  <span className={`font-mono-sys text-[10px] ${killerCorrect ? "text-[#ff3864]" : "text-[#e2c9a0]/20"}`}>
                    {killerCorrect ? "✓" : "✗"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span
                  className="text-xs text-[#e2c9a0]/40"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  動機
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-mono-sys text-[10px] w-5 h-5 flex items-center justify-center rounded border"
                    style={{
                      color:       "#ff3864",
                      borderColor: "rgba(255,56,100,0.3)",
                      background:  "rgba(255,56,100,0.08)",
                    }}
                  >
                    {answer.motiveDirection}
                  </span>
                  <span
                    className="text-sm text-[#e2c9a0]/75"
                    style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                  >
                    {correctMotive.name}
                  </span>
                  <span className={`font-mono-sys text-[10px] ${motiveCorrect ? "text-[#ff3864]" : "text-[#e2c9a0]/20"}`}>
                    {motiveCorrect ? "✓" : "✗"}
                  </span>
                </div>
              </div>

              {answer.subMotiveId && (
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs text-[#e2c9a0]/40"
                    style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                  >
                    子動機
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-sm text-[#e2c9a0]/75"
                      style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                    >
                      {SUB_MOTIVES[answer.subMotiveId].name}
                    </span>
                    <span className={`font-mono-sys text-[10px] ${subMotiveCorrect ? "text-[#ff3864]" : "text-[#e2c9a0]/20"}`}>
                      {subMotiveCorrect ? "✓" : "✗"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-[#e2c9a0]/08 to-transparent" />

            {/* 底部標記 */}
            <div className="flex items-center justify-between">
              <p className="font-mono-sys text-[9px] text-[#e2c9a0]/18 tracking-widest">
                SESSION {sessionId.slice(0, 8).toUpperCase()}
              </p>
              <p className="font-mono-sys text-[9px] text-[#e2c9a0]/18 tracking-widest">
                PHASE ZERO
              </p>
            </div>
          </div>

          {/* 操作區 */}
          <div className="w-full space-y-3">
            {/* 複製分享文字 */}
            <button
              onClick={handleCopy}
              className="w-full py-3.5 border border-[#5bb8ff]/40 text-[#5bb8ff]/80 text-sm tracking-[0.2em] hover:bg-[#5bb8ff]/06 hover:border-[#5bb8ff]/65 active:bg-[#5bb8ff]/12 transition-all duration-300 rounded"
            >
              {copied ? (
                <span className="font-mono-sys text-xs text-[#4ade80]">✓ 已複製到剪貼簿</span>
              ) : (
                <span style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}>
                  複製成績文字
                </span>
              )}
            </button>

            <Link
              href={`/game/${sessionId}/result`}
              className="block w-full py-3 border border-[#e2c9a0]/10 text-[#e2c9a0]/35 text-sm tracking-[0.2em] hover:border-[#e2c9a0]/22 hover:text-[#e2c9a0]/60 transition-all duration-300 rounded text-center"
            >
              返回結果頁
            </Link>

            <Link
              href="/game"
              className="block w-full py-2.5 text-center font-mono-sys text-[10px] text-[#e2c9a0]/20 hover:text-[#e2c9a0]/45 tracking-[0.3em] transition-colors"
            >
              重新開局 →
            </Link>
          </div>

          {/* 提示 */}
          <p
            className="text-[11px] text-[#e2c9a0]/18 text-center leading-relaxed max-w-[240px]"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            在賽德里斯，每一個失蹤都不是意外。
          </p>
        </div>
      </div>
    </div>
  );
}
