"use client";

import { useFontSize, FONT_SIZE_LABELS } from "@/hooks/useFontSize";

interface FontSizeControlProps {
  /** "inline" = 標頭內嵌橫排；"panel" = 設定面板縱排 */
  variant?: "inline" | "panel";
}

/**
 * 文字大小調整控制元件。
 * inline 版本（預設）：A- 標籤 A+，橫向緊湊，放在頁面標頭。
 */
export function FontSizeControl({ variant = "inline" }: FontSizeControlProps) {
  const { size, increase, decrease, canIncrease, canDecrease } = useFontSize();

  if (variant === "panel") {
    return (
      <div className="flex flex-col gap-2">
        <p className="font-mono-sys text-[9px] tracking-[0.4em] text-[#e2c9a0]/30 uppercase">
          文字大小
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={decrease}
            disabled={!canDecrease}
            className="w-7 h-7 flex items-center justify-center rounded border border-[#e2c9a0]/15 font-mono-sys text-[11px] text-[#e2c9a0]/50 hover:text-[#e2c9a0]/80 hover:border-[#e2c9a0]/35 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
            aria-label="縮小字體"
          >
            A−
          </button>
          <span className="font-mono-sys text-[10px] text-[#e2c9a0]/45 w-8 text-center tracking-wide">
            {FONT_SIZE_LABELS[size]}
          </span>
          <button
            onClick={increase}
            disabled={!canIncrease}
            className="w-7 h-7 flex items-center justify-center rounded border border-[#e2c9a0]/15 font-mono-sys text-[11px] text-[#e2c9a0]/50 hover:text-[#e2c9a0]/80 hover:border-[#e2c9a0]/35 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
            aria-label="放大字體"
          >
            A+
          </button>
        </div>
      </div>
    );
  }

  // inline variant
  return (
    <div className="flex items-center gap-1" title={`文字大小：${FONT_SIZE_LABELS[size]}`}>
      <button
        onClick={decrease}
        disabled={!canDecrease}
        className="font-mono-sys text-[9px] text-[#e2c9a0]/30 hover:text-[#e2c9a0]/65 disabled:opacity-20 disabled:cursor-not-allowed transition-colors px-1 py-0.5"
        aria-label="縮小字體"
      >
        A-
      </button>
      <span
        className="font-mono-sys text-[8px] text-[#e2c9a0]/20 tracking-widest select-none"
      >
        {FONT_SIZE_LABELS[size]}
      </span>
      <button
        onClick={increase}
        disabled={!canIncrease}
        className="font-mono-sys text-[11px] text-[#e2c9a0]/30 hover:text-[#e2c9a0]/65 disabled:opacity-20 disabled:cursor-not-allowed transition-colors px-1 py-0.5"
        aria-label="放大字體"
      >
        A+
      </button>
    </div>
  );
}
