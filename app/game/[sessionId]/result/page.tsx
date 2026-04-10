"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SUSPECTS, MOTIVES } from "@/lib/case-config";
import type { KillerId, MotiveDirection } from "@/lib/case-config";

interface AccuseResult {
  correct: boolean;
  killerCorrect: boolean;
  motiveCorrect: boolean;
  score: number;
  result: "win" | "lose";
  answer: { killerId: KillerId; motiveDirection: MotiveDirection };
}

// ── 結局文本 ─────────────────────────────────────────────────
const WIN_FLAVOR = [
  "你做到了。案子沒有蓋棺定論，但你讓事情走向了某種公正。",
  "他們沒辦法再繼續沉默了。",
  "賽德里斯從來不歡迎說真話的人，但今天你說了。",
];

const LOSE_KILLER_WRONG = [
  "你指錯了人。真正的兇手在某個地方，繼續過著他的日子。",
  "第九分局拿到了他們想要的東西：一個替罪羊。",
];

const LOSE_MOTIVE_WRONG = [
  "兇手找對了，但你沒有搞清楚他為什麼這麼做。有些事情，你還不明白。",
  "方向錯了。他的動機比你想的更複雜，或者更簡單。",
];

function pickFlavor(arr: string[], seed: number): string {
  return arr[seed % arr.length];
}

// ── 分數環形進度 ──────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r   = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#c9d6df15" strokeWidth="3" />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke={score >= 60 ? "#ff2e63" : "#c9d6df40"}
          strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease-out" }}
        />
      </svg>
      <span className="text-2xl font-mono text-[#c9d6df]">{score}</span>
    </div>
  );
}

// ── 元件 ─────────────────────────────────────────────────────
export default function ResultPage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;

  const [result,  setResult]  = useState<AccuseResult | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(`pez_result_${sessionId}`);
    if (raw) {
      try {
        setResult(JSON.parse(raw));
        // 短暫延遲後顯示（入場動畫感）
        setTimeout(() => setVisible(true), 200);
      } catch {
        setResult(null);
      }
    }
  }, [sessionId]);

  // 無結果（直接訪問或尚未指控）
  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p
          className="text-sm text-[#c9d6df]/40 mb-6"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        >
          遊戲尚未結束，或資料已遺失。
        </p>
        <Link
          href={`/game/${sessionId}`}
          className="text-xs text-[#c9d6df]/30 hover:text-[#c9d6df]/60 tracking-widest transition-colors border border-[#c9d6df]/15 px-4 py-2 rounded"
        >
          返回調查
        </Link>
      </div>
    );
  }

  const { correct, killerCorrect, motiveCorrect, score, answer } = result;
  const correctKillerDef = SUSPECTS[answer.killerId];
  const correctMotiveDef = MOTIVES[answer.motiveDirection];

  const flavorSeed = answer.killerId.charCodeAt(0);
  const flavorText = correct
    ? pickFlavor(WIN_FLAVOR, flavorSeed)
    : !killerCorrect
    ? pickFlavor(LOSE_KILLER_WRONG, flavorSeed)
    : pickFlavor(LOSE_MOTIVE_WRONG, flavorSeed);

  return (
    <div
      className={`min-h-screen flex flex-col max-w-xl mx-auto transition-opacity duration-700 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* 頭部 */}
      <header className="px-4 py-3 border-b border-[#c9d6df]/10 flex items-center justify-between">
        <Link
          href="/game"
          className="text-xs text-[#c9d6df]/30 hover:text-[#c9d6df]/60 tracking-wider transition-colors"
        >
          ← 大廳
        </Link>
        <p className="text-xs text-[#c9d6df]/30 tracking-widest">結局</p>
        <div className="w-12" />
      </header>

      <div className="flex-1 flex flex-col items-center px-6 py-10 gap-8">
        {/* 結果標題 */}
        <div className="text-center space-y-2">
          {correct ? (
            <>
              <p className="text-[10px] text-[#c9d6df]/25 tracking-[0.4em] uppercase">案件告破</p>
              <h2
                className="text-3xl tracking-widest text-[#ff2e63]"
                style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
              >
                你找到了真相
              </h2>
            </>
          ) : (
            <>
              <p className="text-[10px] text-[#c9d6df]/25 tracking-[0.4em] uppercase">指控失敗</p>
              <h2
                className="text-3xl tracking-widest text-[#c9d6df]/70"
                style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
              >
                {killerCorrect ? "方向錯了" : "找錯了人"}
              </h2>
            </>
          )}
        </div>

        {/* 分數 */}
        <ScoreRing score={score} />

        {/* 風味文字 */}
        <p
          className="text-sm text-center text-[#c9d6df]/50 leading-[2] max-w-xs"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        >
          {flavorText}
        </p>

        {/* 正確答案揭曉 */}
        <div className="w-full border border-[#c9d6df]/10 rounded p-5 space-y-4">
          <p className="text-[10px] text-[#c9d6df]/25 tracking-[0.3em] uppercase">正確答案</p>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-[10px] text-[#c9d6df]/30 mb-1 tracking-wide">兇手</p>
              <div className="flex items-center gap-2">
                <p
                  className="text-base text-[#c9d6df] tracking-wider"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  {correctKillerDef.name}
                </p>
                {killerCorrect && (
                  <span className="text-[10px] text-[#ff2e63]/70 border border-[#ff2e63]/30 px-1.5 py-0.5 rounded">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#c9d6df]/35 mt-0.5">{correctKillerDef.role}</p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-[#c9d6df]/30 mb-1 tracking-wide">動機</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#ff2e63]/60 border border-[#ff2e63]/25 w-5 h-5 flex items-center justify-center rounded-sm font-mono">
                  {answer.motiveDirection}
                </span>
                <p
                  className="text-sm text-[#c9d6df]"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  {correctMotiveDef.name}
                </p>
                {motiveCorrect && (
                  <span className="text-[10px] text-[#ff2e63]/70 border border-[#ff2e63]/30 px-1.5 py-0.5 rounded">
                    ✓
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 兇手描述 */}
          <p
            className="text-xs text-[#c9d6df]/35 leading-relaxed border-t border-[#c9d6df]/8 pt-3"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            {correctKillerDef.description}
          </p>
        </div>

        {/* 統計 */}
        <div className="w-full grid grid-cols-2 gap-2">
          <div className="border border-[#c9d6df]/8 rounded p-3 text-center">
            <p className="text-lg font-mono text-[#c9d6df]">{score}</p>
            <p className="text-[10px] text-[#c9d6df]/25 tracking-wide mt-0.5">總分</p>
          </div>
          <div className="border border-[#c9d6df]/8 rounded p-3 text-center">
            <p className="text-lg font-mono text-[#c9d6df]">
              {killerCorrect && motiveCorrect ? "100" : killerCorrect ? "60" : motiveCorrect ? "40" : "0"} / 100
            </p>
            <p className="text-[10px] text-[#c9d6df]/25 tracking-wide mt-0.5">得分明細</p>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="w-full flex flex-col gap-3">
          <Link
            href="/game"
            className="w-full py-3 border border-[#ff2e63]/50 text-[#ff2e63] text-sm tracking-[0.2em] hover:bg-[#ff2e63]/10 transition-colors rounded text-center"
          >
            重新開局
          </Link>
          <Link
            href={`/game/${sessionId}`}
            className="w-full py-3 border border-[#c9d6df]/15 text-[#c9d6df]/40 text-sm tracking-[0.2em] hover:border-[#c9d6df]/30 hover:text-[#c9d6df]/60 transition-colors rounded text-center"
          >
            回到地圖
          </Link>
        </div>
      </div>
    </div>
  );
}
