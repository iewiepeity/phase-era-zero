/**
 * TrustBar — NPC 信任度進度條 + 文字標籤
 * 顯示在對話頁面右上角。
 */

/** 將數字信任度轉為文字描述 */
export function trustLabel(level: number): string {
  if (level < 15) return "陌生";
  if (level < 35) return "熟面孔";
  if (level < 60) return "可信";
  if (level < 85) return "知心";
  return "至交";
}

interface TrustBarProps {
  /** 0–100 的信任度 */
  level:    number;
  /** NPC 強調色（用於進度條與標籤）*/
  dotColor: string;
}

/**
 * 信任度進度條與等級標籤。
 *
 * @example
 * <TrustBar level={npcState.trustLevel} dotColor={npcColor.dot} />
 */
export function TrustBar({ level, dotColor }: TrustBarProps) {
  const percent = Math.min(100, level);

  return (
    <div className="flex flex-col items-end gap-1">
      <span
        className="font-mono-sys text-[9px] tracking-widest"
        style={{ color: `${dotColor}70` }}
      >
        {trustLabel(level)}
      </span>
      <div className="w-14 h-[2px] rounded-full bg-[#e2c9a0]/8 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width:      `${percent}%`,
            background: `linear-gradient(90deg, ${dotColor}99, ${dotColor})`,
            boxShadow:  `0 0 6px ${dotColor}80`,
          }}
        />
      </div>
    </div>
  );
}
