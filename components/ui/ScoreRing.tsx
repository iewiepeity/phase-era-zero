/**
 * ScoreRing — SVG 環形分數顯示元件
 * 分數 ≥ 60 顯示強調紅色並帶光暈，< 60 顯示暗色。
 */

interface ScoreRingProps {
  /** 0–100 的分數 */
  score:   number;
  /** 是否啟動填充動畫 */
  animate: boolean;
}

export function ScoreRing({ score, animate }: ScoreRingProps) {
  const r      = 38;
  const circ   = 2 * Math.PI * r;   // ≈ 238.76
  const dash   = animate ? (score / 100) * circ : 0;
  const isGood = score >= 60;

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg
        className="absolute inset-0 -rotate-90"
        width="112"
        height="112"
        viewBox="0 0 112 112"
      >
        {/* 底圈 */}
        <circle
          cx="56" cy="56" r={r}
          fill="none"
          stroke="rgba(226,201,160,0.07)"
          strokeWidth="3"
        />
        {/* 進度圈 */}
        <circle
          cx="56" cy="56" r={r}
          fill="none"
          stroke={isGood ? "#ff3864" : "rgba(226,201,160,0.3)"}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{
            transition: "stroke-dasharray 1.6s cubic-bezier(0.16,1,0.3,1)",
            filter:     isGood ? "drop-shadow(0 0 6px rgba(255,56,100,0.5))" : undefined,
          }}
        />
      </svg>
      {/* 分數數字 */}
      <div className="text-center">
        <span className="font-mono-sys text-2xl text-[#e2c9a0]">{score}</span>
        <p className="font-mono-sys text-[9px] text-[#e2c9a0]/30 tracking-widest">PTS</p>
      </div>
    </div>
  );
}
