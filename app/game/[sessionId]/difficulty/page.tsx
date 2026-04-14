"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DIFFICULTIES, DEFAULT_DIFFICULTY, type DifficultyId } from "@/lib/content/difficulty";
import { STORAGE_KEYS } from "@/lib/constants";
import { initActionPoints } from "@/lib/services/action-points";

/**
 * /game/[sessionId]/difficulty
 *
 * 難度選擇頁面，插入於身份選擇 → 遊戲主畫面之間。
 * 選完後：
 *   1. 寫入 localStorage
 *   2. PATCH /api/game/difficulty（寫入 game_sessions.difficulty）
 *   3. 導向 /game/[sessionId]
 */
export default function DifficultyPage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;
  const router    = useRouter();

  const [selected, setSelected] = useState<DifficultyId>(DEFAULT_DIFFICULTY);
  const [saving,   setSaving]   = useState(false);
  const [hovered,  setHovered]  = useState<DifficultyId | null>(null);

  // 如果已經選過難度，跳過這頁
  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEYS.DIFFICULTY(sessionId));
    if (done) router.replace(`/game/${sessionId}/name`);
  }, [sessionId, router]);

  async function handleConfirm() {
    if (saving) return;
    setSaving(true);

    // 1. localStorage
    localStorage.setItem(STORAGE_KEYS.DIFFICULTY(sessionId), selected);
    // 初始化行動點（依難度設定）
    initActionPoints(sessionId, selected);

    // 2. DB（非阻塞）
    try {
      await fetch("/api/game/difficulty", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ sessionId, difficulty: selected }),
      });
    } catch {
      // silently continue
    }

    // 3. 取名後進入遊戲主畫面
    router.push(`/game/${sessionId}/name`);
  }

  const chosenDef = DIFFICULTIES.find((d) => d.id === selected)!;

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117]">
      <div className="fixed inset-0 bg-grid-static opacity-40 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex-1 flex flex-col max-w-lg mx-auto w-full px-5 pt-14 pb-12">

        {/* 標頭 */}
        <div className="mb-10">
          <p className="font-mono-sys text-[10px] text-[#5bb8ff]/30 tracking-[0.4em] uppercase mb-3">
            難度設定
          </p>
          <h1
            className="text-xl tracking-widest text-[#e2c9a0]/90 mb-2"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            這場調查有多難？
          </h1>
          <div className="h-px bg-gradient-to-r from-[#e2c9a0]/15 to-transparent" />
          <p
            className="mt-4 text-xs text-[#e2c9a0]/38 leading-relaxed"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            難度影響 NPC 說話的誠實程度，以及線索的可見性。之後可以在設定中調整。
          </p>
        </div>

        {/* 難度選項 */}
        <div className="flex flex-col gap-3 flex-1">
          {DIFFICULTIES.map((diff) => {
            const isSelected = selected === diff.id;
            const isHovered  = hovered === diff.id;

            return (
              <button
                key={diff.id}
                onClick={() => setSelected(diff.id)}
                onMouseEnter={() => setHovered(diff.id)}
                onMouseLeave={() => setHovered(null)}
                className="w-full text-left rounded p-4 border transition-all duration-300 focus:outline-none"
                style={{
                  borderColor: isSelected
                    ? diff.accentColor
                    : isHovered
                    ? diff.borderColor
                    : "rgba(226,201,160,0.08)",
                  background: isSelected ? diff.bgColor : "transparent",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full border transition-all duration-200"
                      style={{
                        borderColor:     diff.accentColor,
                        backgroundColor: isSelected ? diff.accentColor : "transparent",
                      }}
                    />
                    <span
                      className="text-sm tracking-widest"
                      style={{
                        fontFamily: "var(--font-noto-serif-tc), serif",
                        color:      isSelected ? diff.accentColor : "rgba(226,201,160,0.70)",
                      }}
                    >
                      {diff.name}
                    </span>
                    <span
                      className="font-mono-sys text-[9px] tracking-[0.3em]"
                      style={{ color: `${diff.accentColor}55` }}
                    >
                      {diff.subtitle}
                    </span>
                  </div>
                </div>

                <p
                  className="text-xs text-[#e2c9a0]/50 leading-relaxed mb-3"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  {diff.description}
                </p>

                <ul className="space-y-1">
                  {diff.traits.map((trait, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-[10px] text-[#e2c9a0]/35"
                      style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                    >
                      <span
                        className="mt-0.5 text-[7px] shrink-0"
                        style={{ color: `${diff.accentColor}60` }}
                      >
                        ◆
                      </span>
                      {trait}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* 確認按鈕 */}
        <div className="mt-8">
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="w-full py-3.5 border text-sm tracking-[0.2em] transition-all duration-300 rounded disabled:opacity-30 hover:opacity-90"
            style={{
              borderColor: chosenDef.accentColor,
              color:       chosenDef.accentColor,
            }}
          >
            {saving ? (
              <span className="font-mono-sys text-xs">LOADING...</span>
            ) : (
              `以「${chosenDef.name}」開始調查`
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
