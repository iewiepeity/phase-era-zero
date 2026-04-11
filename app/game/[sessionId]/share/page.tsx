"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SUSPECTS, MOTIVES } from "@/lib/case-config";
import { STORAGE_KEYS } from "@/lib/constants";
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

// ── 主元件 ───────────────────────────────────────────────────

export default function SharePage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;

  const [result,       setResult]       = useState<AccuseResult | null>(null);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [actionPoints, setActionPoints] = useState<{ used: number; max: number } | null>(null);
  const [copied,       setCopied]       = useState(false);

  useEffect(() => {
    // 讀取結果
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RESULT(sessionId));
      if (raw) setResult(JSON.parse(raw) as AccuseResult);
    } catch { /* ignore */ }

    // 讀取成就
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS(sessionId));
      setAchievements(raw ? raw.split(",").filter(Boolean) : []);
    } catch { /* ignore */ }

    // 計算行動點耗用
    try {
      const max     = parseInt(localStorage.getItem(STORAGE_KEYS.MAX_ACTION_POINTS(sessionId)) ?? "0", 10);
      const current = parseInt(localStorage.getItem(STORAGE_KEYS.ACTION_POINTS(sessionId))     ?? "0", 10);
      if (max > 0) setActionPoints({ used: max - current, max });
    } catch { /* ignore */ }
  }, [sessionId]);

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d1117] px-4">
        <p className="font-mono-sys text-[11px] text-[#e2c9a0]/30 tracking-widest">
          找不到遊戲結果。請先完成一局遊戲。
        </p>
        <Link
          href={`/game/${sessionId}`}
          className="mt-6 font-mono-sys text-[10px] text-[#5bb8ff]/40 hover:text-[#5bb8ff]/70 tracking-widest transition-colors"
        >
          返回遊戲 →
        </Link>
      </div>
    );
  }

  const scoreColor  = result.score >= 80 ? "#ff3864" : result.score >= 50 ? "#f59e0b" : "#5bb8ff";
  const scoreLabel  = result.score >= 80 ? "PERFECT" : result.score >= 50 ? "GOOD" : "INCOMPLETE";
  const killerName  = SUSPECTS[result.answer.killerId]?.name ?? result.answer.killerId;
  const motiveName  = MOTIVES[result.answer.motiveDirection]?.name ?? result.answer.motiveDirection;

  const shareText = [
    "【相變世紀：零】調查報告",
    "─────────────────────",
    `評級：${scoreLabel}（${result.score} 分）`,
    `兇手：${result.killerCorrect ? "✓ 正確" : "✗ 錯誤"}`,
    `動機：${result.motiveCorrect ? "✓ 正確" : "✗ 錯誤"}`,
    `行動點：${actionPoints ? `${actionPoints.used}/${actionPoints.max}` : "—"}`,
    `成就解鎖：${achievements.length} 個`,
    "─────────────────────",
    `真相是：${killerName}（${motiveName}）`,
    "",
    "你也來試試看？",
  ].join("\n");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = shareText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="min-h-screen flex flex-col max-w-sm mx-auto bg-[#0d1117] px-4 py-8">

      {/* 標題列 */}
      <header className="flex items-center justify-between mb-8">
        <Link
          href={`/game/${sessionId}/result`}
          className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/60 tracking-widest transition-colors"
        >
          ← 返回
        </Link>
        <p
          className="text-xs tracking-widest text-[#e2c9a0]/50"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        >
          成績卡片
        </p>
        <div className="w-12" />
      </header>

      {/* 成績卡片 */}
      <div
        className="relative rounded border border-[#e2c9a0]/12 p-6 space-y-5 animate-fade-in"
        style={{ background: "linear-gradient(135deg, #0d1117 0%, #111820 100%)" }}
      >
        {/* 頂部裝飾線 */}
        <div
          className="absolute top-0 left-6 right-6 h-[2px] rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${scoreColor}, transparent)` }}
        />

        {/* 遊戲標題 */}
        <div className="text-center">
          <p className="font-mono-sys text-[9px] text-[#5bb8ff]/30 tracking-[0.5em] uppercase mb-1">
            PHASE CENTURY : ZERO
          </p>
          <p
            className="text-base tracking-wider text-[#e2c9a0]/70"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            調查報告
          </p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-[#e2c9a0]/08 to-transparent" />

        {/* 評級 & 分數 */}
        <div className="text-center">
          <p
            className="font-mono-sys text-4xl font-bold tabular-nums"
            style={{ color: scoreColor, textShadow: `0 0 20px ${scoreColor}40` }}
          >
            {result.score}
          </p>
          <p
            className="font-mono-sys text-[11px] tracking-[0.4em] mt-1"
            style={{ color: `${scoreColor}99` }}
          >
            {scoreLabel}
          </p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-[#e2c9a0]/08 to-transparent" />

        {/* 詳細結果 */}
        <div className="space-y-3">
          {/* 兇手 */}
          <div className="flex items-center justify-between">
            <span
              className="text-xs text-[#e2c9a0]/45"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              兇手指認
            </span>
            <span
              className="font-mono-sys text-[11px]"
              style={{ color: result.killerCorrect ? "#4ade80" : "#ff3864" }}
            >
              {result.killerCorrect ? "✓ 正確" : "✗ 錯誤"}
            </span>
          </div>

          {/* 動機 */}
          <div className="flex items-center justify-between">
            <span
              className="text-xs text-[#e2c9a0]/45"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              動機推理
            </span>
            <span
              className="font-mono-sys text-[11px]"
              style={{ color: result.motiveCorrect ? "#4ade80" : result.killerCorrect ? "#f59e0b" : "#ff3864" }}
            >
              {result.motiveCorrect ? "✓ 正確" : "✗ 錯誤"}
            </span>
          </div>

          {/* 行動點 */}
          {actionPoints && (
            <div className="flex items-center justify-between">
              <span
                className="text-xs text-[#e2c9a0]/45"
                style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
              >
                行動點耗用
              </span>
              <span className="font-mono-sys text-[11px] text-[#5bb8ff]/60">
                {actionPoints.used} / {actionPoints.max}
              </span>
            </div>
          )}

          {/* 成就 */}
          <div className="flex items-center justify-between">
            <span
              className="text-xs text-[#e2c9a0]/45"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              成就解鎖
            </span>
            <span className="font-mono-sys text-[11px] text-[#c084fc]/60">
              {achievements.length} 個
            </span>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-[#e2c9a0]/08 to-transparent" />

        {/* 真相揭示 */}
        <div className="text-center space-y-1">
          <p className="font-mono-sys text-[9px] text-[#e2c9a0]/25 tracking-[0.4em] uppercase">
            TRUE ANSWER
          </p>
          <p
            className="text-sm text-[#e2c9a0]/70 tracking-wide"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            {killerName}
          </p>
          <p
            className="text-[11px] text-[#e2c9a0]/35"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            {motiveName}
          </p>
        </div>

        {/* 底部裝飾線 */}
        <div
          className="absolute bottom-0 left-6 right-6 h-[1px] rounded-full"
          style={{ background: "linear-gradient(90deg, transparent, rgba(226,201,160,0.06), transparent)" }}
        />
      </div>

      {/* 複製按鈕 */}
      <button
        onClick={handleCopy}
        className="mt-6 w-full py-3.5 rounded border transition-all duration-300"
        style={{
          borderColor: copied ? "rgba(74,222,128,0.5)" : "rgba(226,201,160,0.15)",
          color:       copied ? "#4ade80" : "rgba(226,201,160,0.6)",
          background:  copied ? "rgba(74,222,128,0.05)" : "transparent",
        }}
      >
        <span
          className="text-sm tracking-[0.15em]"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        >
          {copied ? "已複製！" : "複製分享文字"}
        </span>
      </button>

      {/* 分享文字預覽 */}
      <pre
        className="mt-4 p-4 rounded border border-[#e2c9a0]/06 font-mono-sys text-[10px] text-[#e2c9a0]/25 leading-relaxed whitespace-pre-wrap"
        style={{ background: "rgba(255,255,255,0.01)" }}
      >
        {shareText}
      </pre>

      {/* 導航 */}
      <div className="mt-6 flex justify-center gap-6">
        <Link
          href={`/game/${sessionId}/result`}
          className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/55 tracking-[0.3em] transition-colors"
        >
          查看結局
        </Link>
        <Link
          href="/game"
          className="font-mono-sys text-[10px] text-[#5bb8ff]/25 hover:text-[#5bb8ff]/55 tracking-[0.3em] transition-colors"
        >
          再玩一局
        </Link>
      </div>
    </div>
  );
}
