"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SCENES } from "@/lib/scene-config";

// ── 開場敘述文本 ──────────────────────────────────────────────
const INTRO_FULL = `P.E. 02 年，賽德里斯，中城區。

第十四名失蹤者昨晚消失。

警方沒有找到屍體，但他們找到了你的名字——出現在每一個失蹤者的通話紀錄裡。

你不是兇手。但你需要證明這件事，在第九分局拿到逮捕令之前。

你在中城區還有一點自由的時間。城市裡有人知道真相——找出他們，找出真正的兇手。`;

const TYPING_MS = 20;

// ── 場景視覺配色（各場景獨立色調）─────────────────────────────
const SCENE_PALETTE: Record<string, {
  accent: string;
  glow: string;
  border: string;
  borderHover: string;
  badge: string;
}> = {
  chen_jie_noodles: {
    accent:      "#f59e0b",
    glow:        "rgba(245,158,11,0.12)",
    border:      "rgba(245,158,11,0.18)",
    borderHover: "rgba(245,158,11,0.45)",
    badge:       "rgba(245,158,11,0.15)",
  },
  crime_scene: {
    accent:      "#5bb8ff",
    glow:        "rgba(91,184,255,0.08)",
    border:      "rgba(91,184,255,0.12)",
    borderHover: "rgba(91,184,255,0.30)",
    badge:       "rgba(91,184,255,0.12)",
  },
  foggy_port: {
    accent:      "#14b8a6",
    glow:        "rgba(20,184,166,0.08)",
    border:      "rgba(20,184,166,0.12)",
    borderHover: "rgba(20,184,166,0.30)",
    badge:       "rgba(20,184,166,0.12)",
  },
  ninth_precinct: {
    accent:      "#ff3864",
    glow:        "rgba(255,56,100,0.08)",
    border:      "rgba(255,56,100,0.14)",
    borderHover: "rgba(255,56,100,0.35)",
    badge:       "rgba(255,56,100,0.12)",
  },
};

const DEFAULT_PALETTE = SCENE_PALETTE.crime_scene;

export default function GameHubPage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;
  const router    = useRouter();

  const [showIntro, setShowIntro] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [typedLen,  setTypedLen]  = useState(0);
  const [showHub,   setShowHub]   = useState(false);

  const hasMounted = useRef(false);

  // ── 初始化 ───────────────────────────────────────────────────
  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;

    const seen = localStorage.getItem(`pez_seen_intro_${sessionId}`);
    if (!seen) {
      setShowIntro(true);
    } else {
      setShowHub(true);
    }
  }, [sessionId]);

  // ── 打字機 ────────────────────────────────────────────────────
  useEffect(() => {
    if (!showIntro || introDone) return;
    if (typedLen >= INTRO_FULL.length) {
      setIntroDone(true);
      return;
    }
    const t = setTimeout(() => setTypedLen((n) => n + 1), TYPING_MS);
    return () => clearTimeout(t);
  }, [showIntro, introDone, typedLen]);

  const skipIntro = useCallback(() => {
    setTypedLen(INTRO_FULL.length);
    setIntroDone(true);
  }, []);

  function dismissIntro() {
    localStorage.setItem(`pez_seen_intro_${sessionId}`, "1");
    setShowIntro(false);
    setShowHub(true);
  }

  // ── 開場白畫面 ────────────────────────────────────────────────
  if (showIntro) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0d1117]">
        {/* 背景格子 */}
        <div className="fixed inset-0 bg-grid-static opacity-40 pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-xl mx-auto w-full px-6">
          {/* 上方 meta 標籤 */}
          <div className="mb-8 flex items-center gap-2">
            <span className="font-mono-sys text-[10px] text-[#5bb8ff]/35 tracking-widest">
              PEO2 / INCIDENT BRIEF
            </span>
            <span className="flex-1 h-px bg-[#5bb8ff]/12" />
          </div>

          {/* 敘述文字 */}
          <div
            className="text-sm leading-[2.1] text-[#e2c9a0]/80 whitespace-pre-wrap mb-10"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            {INTRO_FULL.slice(0, typedLen)}
            {!introDone && <span className="typing-cursor" />}
          </div>

          {/* 操作按鈕 */}
          <div className="flex items-center gap-6">
            {!introDone ? (
              <button
                onClick={skipIntro}
                className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/55 tracking-widest transition-colors"
              >
                略過 →
              </button>
            ) : (
              <button
                onClick={dismissIntro}
                className="px-8 py-3 border border-[#ff3864]/55 text-[#ff3864] text-sm tracking-[0.25em] hover:bg-[#ff3864]/10 hover:border-[#ff3864]/80 transition-all duration-300 rounded glow-box-accent animate-fade-in"
              >
                開始調查
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── 遊戲主畫面 ────────────────────────────────────────────────
  if (!showHub) return null;

  return (
    <div
      className={`min-h-screen flex flex-col max-w-2xl mx-auto transition-opacity duration-700 ${showHub ? "opacity-100" : "opacity-0"}`}
    >
      {/* 頂部導覽 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#e2c9a0]/6">
        <Link
          href="/game"
          className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/55 tracking-widest transition-colors"
        >
          ← 大廳
        </Link>

        <div className="text-center">
          <p
            className="text-xs tracking-widest text-[#e2c9a0]/55"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            賽德里斯　中城區
          </p>
          <p className="font-mono-sys text-[9px] text-[#5bb8ff]/30 tracking-widest mt-0.5">
            P.E. 02 &nbsp;·&nbsp; 調查中
          </p>
        </div>

        <button
          onClick={() => router.push(`/game/${sessionId}/accuse`)}
          className="font-mono-sys text-[10px] border border-[#ff3864]/35 text-[#ff3864]/65 px-3 py-1.5 rounded hover:bg-[#ff3864]/10 hover:border-[#ff3864]/60 hover:text-[#ff3864] transition-all duration-200 tracking-wide"
        >
          指控
        </button>
      </header>

      {/* 場景說明 */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono-sys text-[10px] text-[#5bb8ff]/35 tracking-[0.4em] uppercase">地點選擇</span>
          <span className="flex-1 h-px bg-[#5bb8ff]/10" />
        </div>
        <p
          className="text-xs text-[#e2c9a0]/35 leading-relaxed"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        >
          選擇一個地點進入，與在場的人對話，尋找線索。
        </p>
      </div>

      {/* 場景卡片 */}
      <div className="flex-1 px-4 py-2 space-y-3 overflow-y-auto">
        {SCENES.map((scene, idx) => {
          const pal     = SCENE_PALETTE[scene.id] ?? DEFAULT_PALETTE;
          const canEnter = !scene.locked && scene.npcs.length > 0;

          return (
            <div
              key={scene.id}
              onClick={() => canEnter && router.push(`/game/${sessionId}/chat/${scene.npcs[0].id}`)}
              className={`
                relative overflow-hidden rounded p-4 border
                transition-all duration-300
                animate-fade-in-up opacity-0
                ${canEnter ? "cursor-pointer card-lift" : "opacity-40 cursor-default"}
              `}
              style={{
                animationDelay:   `${idx * 80}ms`,
                borderColor:      pal.border,
                backgroundColor:  `${pal.glow}`,
                ...(canEnter ? {} : {}),
              }}
              onMouseEnter={(e) => {
                if (canEnter) {
                  (e.currentTarget as HTMLDivElement).style.borderColor = pal.borderHover;
                  (e.currentTarget as HTMLDivElement).style.boxShadow   = `0 0 20px ${pal.glow}, 0 4px 24px rgba(0,0,0,0.4)`;
                }
              }}
              onMouseLeave={(e) => {
                if (canEnter) {
                  (e.currentTarget as HTMLDivElement).style.borderColor = pal.border;
                  (e.currentTarget as HTMLDivElement).style.boxShadow   = "";
                }
              }}
            >
              {/* 左側裝飾條 */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[2px]"
                style={{ background: `linear-gradient(180deg, ${pal.accent}80, transparent)` }}
              />

              {/* 頂部行：名稱 + 鎖定狀態 */}
              <div className="flex items-start justify-between mb-1 pl-2">
                <div>
                  <p
                    className="text-sm tracking-wider"
                    style={{
                      fontFamily: "var(--font-noto-serif-tc), serif",
                      color: canEnter ? "#e2c9a0" : "#e2c9a0",
                    }}
                  >
                    {scene.name}
                  </p>
                  <p
                    className="font-mono-sys text-[10px] tracking-widest mt-0.5"
                    style={{ color: `${pal.accent}70` }}
                  >
                    {scene.district}
                  </p>
                </div>

                {scene.locked ? (
                  <span
                    className="font-mono-sys text-[9px] px-2 py-0.5 rounded tracking-wide border"
                    style={{
                      color:        `${pal.accent}65`,
                      borderColor:  `${pal.accent}25`,
                      background:   pal.badge,
                    }}
                  >
                    {scene.lockReason ?? "LOCKED"}
                  </span>
                ) : (
                  <span
                    className="font-mono-sys text-[10px] tracking-widest"
                    style={{ color: `${pal.accent}70` }}
                  >
                    →
                  </span>
                )}
              </div>

              {/* 描述 */}
              <p
                className="text-xs text-[#e2c9a0]/40 leading-relaxed my-2 pl-2"
                style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
              >
                {scene.description}
              </p>

              {/* 底部行：NPC + 氛圍 */}
              <div className="flex items-center justify-between mt-2 pl-2">
                <div className="flex gap-1.5">
                  {scene.npcs.map((npc) => (
                    <span
                      key={npc.id}
                      className="text-[10px] px-2 py-0.5 rounded border"
                      style={{
                        color:       `${pal.accent}80`,
                        borderColor: `${pal.accent}25`,
                        background:  pal.badge,
                        fontFamily:  "var(--font-noto-serif-tc), serif",
                      }}
                    >
                      {npc.name}
                    </span>
                  ))}
                  {scene.npcs.length === 0 && (
                    <span className="font-mono-sys text-[10px] text-[#e2c9a0]/18">
                      無人在場
                    </span>
                  )}
                </div>
                <span
                  className="text-[10px] italic text-right max-w-[130px]"
                  style={{
                    color:      `${pal.accent}45`,
                    fontFamily: "var(--font-noto-serif-tc), serif",
                  }}
                >
                  {scene.ambience}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部操作列 */}
      <div className="px-4 py-4 border-t border-[#e2c9a0]/6 flex items-center justify-between">
        <p
          className="text-[10px] text-[#e2c9a0]/18 tracking-wide"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        >
          收集線索，建立信任，再做判斷。
        </p>
        <button
          onClick={() => router.push(`/game/${sessionId}/accuse`)}
          className="font-mono-sys text-[11px] text-[#ff3864]/55 hover:text-[#ff3864]/90 tracking-widest transition-colors"
        >
          我有答案了 →
        </button>
      </div>
    </div>
  );
}
