/**
 * SuspectCard — 嫌疑人選擇卡片按鈕
 * 指控頁面步驟 1 使用。
 */

import type { SuspectDefinition, KillerId } from "@/lib/case-config";

interface SuspectCardProps {
  suspect:    SuspectDefinition;
  /** 嫌疑人在列表中的序號（從 1 開始）*/
  number:     number;
  /** 目前是否被選中 */
  selected:   boolean;
  /** 卡片出現動畫的延遲 index */
  animIndex:  number;
  onClick:    (id: KillerId) => void;
}

/**
 * 嫌疑人卡片按鈕，選中狀態有紅色邊框與光暈。
 *
 * @example
 * <SuspectCard
 *   suspect={s}
 *   number={idx + 1}
 *   selected={chosenKiller === s.id}
 *   animIndex={idx}
 *   onClick={(id) => { setChosenKiller(id); setStep(2); }}
 * />
 */
export function SuspectCard({ suspect, number, selected, animIndex, onClick }: SuspectCardProps) {
  const numStr = String(number).padStart(2, "0");

  return (
    <button
      onClick={() => onClick(suspect.id)}
      className="relative text-left p-3.5 border rounded transition-all duration-200 card-lift animate-fade-in-up opacity-0"
      style={{
        animationDelay: `${animIndex * 40}ms`,
        borderColor:    selected ? "#ff3864" : "rgba(226,201,160,0.10)",
        background:     selected ? "rgba(255,56,100,0.07)" : "rgba(17,24,32,0.8)",
        boxShadow:      selected ? "0 0 16px rgba(255,56,100,0.15)" : undefined,
      }}
    >
      {/* 序號 */}
      <span className="absolute top-2.5 right-2.5 font-mono-sys text-[9px] text-[#e2c9a0]/20 tracking-wider">
        {numStr}
      </span>

      {/* 名稱 */}
      <p
        className="text-sm text-[#e2c9a0] tracking-wide mb-0.5 pr-6"
        style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
      >
        {suspect.name}
      </p>

      {/* 身份標籤 */}
      <span
        className="inline-block font-mono-sys text-[9px] px-1.5 py-0.5 rounded mb-1.5"
        style={{
          color:      "rgba(226,201,160,0.45)",
          background: "rgba(226,201,160,0.07)",
          border:     "1px solid rgba(226,201,160,0.10)",
        }}
      >
        {suspect.role}
      </span>

      {/* 描述 */}
      <p
        className="text-[10px] text-[#e2c9a0]/35 leading-relaxed line-clamp-2"
        style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
      >
        {suspect.description}
      </p>
    </button>
  );
}
