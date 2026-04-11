"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { STORAGE_KEYS } from "@/lib/constants";

type PlayerIdentity = "normal" | "phase2";

interface IdentityOption {
  id:          PlayerIdentity;
  label:       string;
  subtitle:    string;
  description: string;
  traits:      string[];
  warning?:    string;
  accentColor: string;
  borderColor: string;
  bgColor:     string;
}

const OPTIONS: IdentityOption[] = [
  {
    id:          "normal",
    label:       "一般人",
    subtitle:    "Route A",
    description:
      "你是普通的賽德里斯市民。沒有特殊能力，沒有異常記憶。" +
      "你靠邏輯、觀察與人際關係釐清案件。",
    traits: [
      "NPC 對你的初始信任度較高",
      "對話路線清晰，不受感知干擾",
      "純推理路線，適合首次遊玩",
    ],
    accentColor: "#5bb8ff",
    borderColor: "rgba(91,184,255,0.35)",
    bgColor:     "rgba(91,184,255,0.04)",
  },
  {
    id:          "phase2",
    label:       "第二相體",
    subtitle:    "Route B",
    description:
      "你的感知方式與一般人不同。你能察覺別人察覺不到的東西——" +
      "但這份能力正在消耗你。",
    traits: [
      "特殊感知：能讀取環境殘留的情緒痕跡",
      "EV（獸性侵蝕值）系統：特殊行為會累積風險",
      "部分 NPC 對你的反應會有所不同",
    ],
    warning:     "第二相體在賽德里斯的法律地位尚未確立。",
    accentColor: "#ff3864",
    borderColor: "rgba(255,56,100,0.35)",
    bgColor:     "rgba(255,56,100,0.04)",
  },
];

/**
 * /game/[sessionId]/identity
 *
 * 身份選擇頁面。
 * 玩家選擇「一般人（Route A）」或「第二相體（Route B）」。
 * 選完後：
 *   1. 寫入 localStorage
 *   2. PATCH /api/game/identity（寫入 game_sessions.player_identity）
 *   3. 導向 /game/[sessionId]
 */
export default function IdentityPage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;
  const router    = useRouter();

  const [selected,  setSelected]  = useState<PlayerIdentity | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [hovered,   setHovered]   = useState<PlayerIdentity | null>(null);

  async function handleConfirm() {
    if (!selected || saving) return;
    setSaving(true);

    // 1. localStorage
    localStorage.setItem(STORAGE_KEYS.IDENTITY(sessionId), selected);

    // 2. 寫入 DB（非阻塞，失敗不攔路）
    try {
      await fetch("/api/game/identity", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ sessionId, identity: selected }),
      });
    } catch {
      // silently continue — localStorage 已存，遊戲可正常進行
    }

    // 3. 導向難度選擇
    router.push(`/game/${sessionId}/difficulty`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117]">
      <div className="fixed inset-0 bg-grid-static opacity-40 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex-1 flex flex-col max-w-lg mx-auto w-full px-5 pt-14 pb-12">

        {/* 標頭 */}
        <div className="mb-10">
          <p className="font-mono-sys text-[10px] text-[#5bb8ff]/30 tracking-[0.4em] uppercase mb-3">
            身份確認
          </p>
          <h1
            className="text-xl tracking-widest text-[#e2c9a0]/90 mb-2"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            你是誰？
          </h1>
          <div className="h-px bg-gradient-to-r from-[#e2c9a0]/15 to-transparent" />
          <p
            className="mt-4 text-xs text-[#e2c9a0]/38 leading-relaxed"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            這個選擇會影響你在賽德里斯的調查方式，以及部分 NPC 對你的態度。
          </p>
        </div>

        {/* 選項卡片 */}
        <div className="flex flex-col gap-4 flex-1">
          {OPTIONS.map((opt) => {
            const isSelected = selected === opt.id;
            const isHovered  = hovered === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                onMouseEnter={() => setHovered(opt.id)}
                onMouseLeave={() => setHovered(null)}
                className="w-full text-left rounded p-5 border transition-all duration-300 focus:outline-none"
                style={{
                  borderColor: isSelected
                    ? opt.accentColor
                    : isHovered
                    ? opt.borderColor
                    : "rgba(226,201,160,0.10)",
                  background: isSelected ? opt.bgColor : "transparent",
                  boxShadow:  isSelected
                    ? `0 0 16px ${opt.bgColor}`
                    : "none",
                }}
              >
                {/* 卡片頂部 */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {/* 選取指示器 */}
                      <span
                        className="w-2 h-2 rounded-full border transition-all duration-200"
                        style={{
                          borderColor:     opt.accentColor,
                          backgroundColor: isSelected ? opt.accentColor : "transparent",
                        }}
                      />
                      <span
                        className="text-base tracking-widest transition-colors duration-200"
                        style={{
                          fontFamily: "var(--font-noto-serif-tc), serif",
                          color:      isSelected ? opt.accentColor : "rgba(226,201,160,0.75)",
                        }}
                      >
                        {opt.label}
                      </span>
                    </div>
                    <span
                      className="font-mono-sys text-[9px] tracking-[0.35em]"
                      style={{ color: `${opt.accentColor}60` }}
                    >
                      {opt.subtitle}
                    </span>
                  </div>
                </div>

                {/* 描述 */}
                <p
                  className="text-xs text-[#e2c9a0]/55 leading-relaxed mb-4"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  {opt.description}
                </p>

                {/* 特性列表 */}
                <ul className="space-y-1.5">
                  {opt.traits.map((trait, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[11px] text-[#e2c9a0]/40"
                      style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                    >
                      <span
                        className="mt-0.5 text-[8px] shrink-0"
                        style={{ color: `${opt.accentColor}80` }}
                      >
                        ◆
                      </span>
                      {trait}
                    </li>
                  ))}
                </ul>

                {/* 警告文字 */}
                {opt.warning && (
                  <p
                    className="mt-4 text-[10px] tracking-wide"
                    style={{
                      fontFamily: "var(--font-noto-serif-tc), serif",
                      color:      `${opt.accentColor}70`,
                    }}
                  >
                    ⚠ {opt.warning}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* 確認按鈕 */}
        <div className="mt-8">
          <button
            onClick={handleConfirm}
            disabled={!selected || saving}
            className="w-full py-3.5 border text-sm tracking-[0.2em] transition-all duration-300 rounded disabled:opacity-30"
            style={{
              borderColor: selected
                ? OPTIONS.find((o) => o.id === selected)?.accentColor ?? "#e2c9a0"
                : "rgba(226,201,160,0.15)",
              color: selected
                ? OPTIONS.find((o) => o.id === selected)?.accentColor ?? "#e2c9a0"
                : "rgba(226,201,160,0.30)",
            }}
          >
            {saving ? (
              <span className="font-mono-sys text-xs">LOADING...</span>
            ) : selected ? (
              `以「${OPTIONS.find((o) => o.id === selected)?.label}」身份進入`
            ) : (
              "選擇身份後繼續"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
