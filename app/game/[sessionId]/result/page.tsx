"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SUSPECTS, MOTIVES, SUB_MOTIVES } from "@/lib/case-config";
import { STORAGE_KEYS } from "@/lib/constants";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { WIN_TEXTS, LOSE_KILLER_TEXTS, LOSE_MOTIVE_TEXTS } from "@/lib/content/endings";
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

function pickText(arr: readonly string[], seed: number): string {
  return arr[seed % arr.length];
}

// ── 粒子閃光（win 效果）──────────────────────────────────────
function WinSparkles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-[#ff3864] animate-neon-pulse"
          style={{
            top:               `${10 + i * 10}%`,
            left:              `${5 + (i % 3) * 35}%`,
            opacity:           0.4 + (i % 3) * 0.15,
            animationDelay:    `${i * 0.3}s`,
            animationDuration: `${1.5 + i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── 主元件 ───────────────────────────────────────────────────
export default function ResultPage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;

  const [result,      setResult]      = useState<AccuseResult | null>(null);
  const [phaseIdx,    setPhaseIdx]    = useState(0);   // 0=黑屏 1=標題 2=分數 3=全顯
  const [ringAnimate, setRingAnimate] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.RESULT(sessionId));
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as AccuseResult;
      setResult(data);

      const t1 = setTimeout(() => setPhaseIdx(1),         300);
      const t2 = setTimeout(() => setPhaseIdx(2),        1000);
      const t3 = setTimeout(() => setRingAnimate(true),  1200);
      const t4 = setTimeout(() => setPhaseIdx(3),        2200);
      timerRef.current = [t1, t2, t3, t4];
    } catch { /* ignore */ }

    return () => timerRef.current.forEach(clearTimeout);
  }, [sessionId]);

  // ── 無資料 ────────────────────────────────────────────────
  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-[#0d1117]">
        <p
          className="text-sm text-[#e2c9a0]/35 mb-6"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        >
          遊戲尚未結束，或資料已遺失。
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

  const { correct, killerCorrect, motiveCorrect, subMotiveCorrect, score, answer } = result;
  const correctKiller = SUSPECTS[answer.killerId];
  const correctMotive = MOTIVES[answer.motiveDirection];
  const flavorSeed    = answer.killerId.charCodeAt(0);
  const flavorText    = correct
    ? pickText(WIN_TEXTS, flavorSeed)
    : !killerCorrect
    ? pickText(LOSE_KILLER_TEXTS, flavorSeed)
    : pickText(LOSE_MOTIVE_TEXTS, flavorSeed);

  return (
    <div className="relative min-h-screen flex flex-col bg-[#0d1117] overflow-hidden">

      {/* 背景格子 */}
      <div className="absolute inset-0 bg-grid-static opacity-30" aria-hidden="true" />

      {/* Win 閃光粒子 */}
      {correct && phaseIdx >= 3 && <WinSparkles />}

      {/* Win 中心光暈 */}
      {correct && (
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-opacity duration-1000"
          style={{
            width:      "500px",
            height:     "300px",
            background: "radial-gradient(ellipse, rgba(255,56,100,0.08) 0%, transparent 70%)",
            opacity:    phaseIdx >= 2 ? 1 : 0,
          }}
          aria-hidden="true"
        />
      )}

      {/* ── 內容 ─────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col max-w-xl mx-auto w-full">

        {/* 標題列 */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-[#e2c9a0]/6">
          <Link
            href="/game"
            className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/60 tracking-widest transition-colors"
          >
            ← 大廳
          </Link>
          <p className="font-mono-sys text-[10px] text-[#5bb8ff]/35 tracking-widest">CASE CLOSED</p>
          <div className="w-16" />
        </header>

        <div className="flex-1 flex flex-col items-center px-6 py-8 gap-7">

          {/* 結果標題 */}
          <div
            className="text-center space-y-1 transition-all duration-700"
            style={{ opacity: phaseIdx >= 1 ? 1 : 0, transform: phaseIdx >= 1 ? "translateY(0)" : "translateY(20px)" }}
          >
            <p className="font-mono-sys text-[9px] text-[#5bb8ff]/35 tracking-[0.5em] uppercase mb-2">
              {correct ? "CASE SOLVED" : "CASE FAILED"}
            </p>
            {correct ? (
              <h2
                className="text-3xl tracking-widest text-[#ff3864] glow-text-accent"
                style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
              >
                你找到了真相
              </h2>
            ) : (
              <h2
                className="text-3xl tracking-widest text-[#e2c9a0]/65"
                style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
              >
                {killerCorrect ? "方向錯了" : "找錯了人"}
              </h2>
            )}
          </div>

          {/* 分數環 */}
          <div
            className="transition-all duration-700"
            style={{ opacity: phaseIdx >= 2 ? 1 : 0, transform: phaseIdx >= 2 ? "scale(1)" : "scale(0.7)" }}
          >
            <ScoreRing score={score} animate={ringAnimate} />
          </div>

          {/* 其餘內容（分段顯示）*/}
          <div
            className="w-full space-y-5 transition-all duration-700"
            style={{ opacity: phaseIdx >= 3 ? 1 : 0, transform: phaseIdx >= 3 ? "translateY(0)" : "translateY(16px)" }}
          >
            {/* 風味文字 */}
            <p
              className="text-sm text-center text-[#e2c9a0]/48 leading-[2.0] max-w-xs mx-auto"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              {flavorText}
            </p>

            {/* 橫線 */}
            <div className="flex items-center gap-3 max-w-xs mx-auto">
              <span className="flex-1 h-px bg-gradient-to-r from-transparent to-[#e2c9a0]/10" />
              <span className="w-1 h-1 rounded-full bg-[#ff3864]/40" />
              <span className="flex-1 h-px bg-gradient-to-l from-transparent to-[#e2c9a0]/10" />
            </div>

            {/* 正確答案卡 */}
            <div
              className="w-full border border-[#e2c9a0]/8 rounded p-5 space-y-4"
              style={{ background: "rgba(17,24,32,0.85)" }}
            >
              <p className="font-mono-sys text-[9px] text-[#5bb8ff]/35 tracking-[0.35em] uppercase">
                CORRECT ANSWER
              </p>

              <div className="flex gap-4">
                {/* 兇手 */}
                <div className="flex-1">
                  <p className="font-mono-sys text-[9px] text-[#e2c9a0]/25 mb-1 tracking-widest">兇手</p>
                  <div className="flex items-center gap-1.5">
                    <p
                      className="text-sm text-[#e2c9a0] tracking-wide"
                      style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                    >
                      {correctKiller.name}
                    </p>
                    {killerCorrect && (
                      <span className="font-mono-sys text-[9px] text-[#ff3864] border border-[#ff3864]/30 px-1.5 rounded">✓</span>
                    )}
                  </div>
                  <p className="font-mono-sys text-[9px] text-[#e2c9a0]/28 mt-0.5">{correctKiller.role}</p>
                </div>

                {/* 動機方向 */}
                <div className="flex-1">
                  <p className="font-mono-sys text-[9px] text-[#e2c9a0]/25 mb-1 tracking-widest">動機方向</p>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="font-mono-sys text-[9px] w-5 h-5 flex items-center justify-center rounded border"
                      style={{
                        color:       "#ff3864",
                        borderColor: "rgba(255,56,100,0.3)",
                        background:  "rgba(255,56,100,0.10)",
                      }}
                    >
                      {answer.motiveDirection}
                    </span>
                    <p
                      className="text-sm text-[#e2c9a0]"
                      style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                    >
                      {correctMotive.name}
                    </p>
                    {motiveCorrect && (
                      <span className="font-mono-sys text-[9px] text-[#ff3864] border border-[#ff3864]/30 px-1.5 rounded">✓</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 子動機 */}
              {answer.subMotiveId && (
                <div className="border-t border-[#e2c9a0]/6 pt-3">
                  <p className="font-mono-sys text-[9px] text-[#e2c9a0]/25 mb-1.5 tracking-widest">具體動機</p>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono-sys text-[9px] px-1.5 py-0.5 rounded border"
                      style={{
                        color:       "#ff3864",
                        borderColor: "rgba(255,56,100,0.3)",
                        background:  "rgba(255,56,100,0.08)",
                      }}
                    >
                      {answer.subMotiveId}
                    </span>
                    <p
                      className="text-sm text-[#e2c9a0]"
                      style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                    >
                      {SUB_MOTIVES[answer.subMotiveId].name}
                    </p>
                    {subMotiveCorrect && (
                      <span className="font-mono-sys text-[9px] text-[#ff3864] border border-[#ff3864]/30 px-1.5 rounded">✓</span>
                    )}
                  </div>
                  <p
                    className="text-[11px] text-[#e2c9a0]/28 leading-relaxed mt-1"
                    style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                  >
                    {SUB_MOTIVES[answer.subMotiveId].description}
                  </p>
                </div>
              )}

              {/* 角色描述 */}
              <p
                className="text-[11px] text-[#e2c9a0]/30 leading-relaxed border-t border-[#e2c9a0]/6 pt-3"
                style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
              >
                {correctKiller.description}
              </p>
            </div>

            {/* 分數明細 */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "兇手",   pts: killerCorrect    ? 50 : 0, total: 50 },
                { label: "動機",   pts: motiveCorrect    ? 20 : 0, total: 20 },
                { label: "子動機", pts: subMotiveCorrect ? 30 : 0, total: 30 },
              ].map((item) => (
                <div
                  key={item.label}
                  className="border border-[#e2c9a0]/6 rounded p-3 text-center"
                  style={{ background: "rgba(17,24,32,0.7)" }}
                >
                  <p
                    className="font-mono-sys text-base"
                    style={{ color: item.pts > 0 ? "#ff3864" : "rgba(226,201,160,0.4)" }}
                  >
                    {item.pts}
                  </p>
                  <p className="font-mono-sys text-[9px] text-[#e2c9a0]/22 tracking-widest mt-0.5">
                    {item.label} / {item.total}
                  </p>
                </div>
              ))}
            </div>

            {/* 操作按鈕 */}
            <div className="flex flex-col gap-3">
              <Link
                href="/game"
                className="w-full py-3.5 border border-[#ff3864]/55 text-[#ff3864] text-sm tracking-[0.2em] hover:bg-[#ff3864]/10 hover:border-[#ff3864]/80 transition-all duration-300 rounded text-center glow-box-accent"
              >
                重新開局
              </Link>
              <Link
                href={`/game/${sessionId}`}
                className="w-full py-3 border border-[#e2c9a0]/10 text-[#e2c9a0]/35 text-sm tracking-[0.2em] hover:border-[#e2c9a0]/22 hover:text-[#e2c9a0]/60 transition-all duration-300 rounded text-center"
              >
                回到地圖
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
