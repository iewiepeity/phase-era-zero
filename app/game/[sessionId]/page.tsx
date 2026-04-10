"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SCENES } from "@/lib/scene-config";

// ── 開場敘述 ──────────────────────────────────────────────────
const INTRO_PARAGRAPHS = [
  "P.E. 02 年，賽德里斯，中城區。",
  "第十四名失蹤者昨晚消失。",
  "警方沒有找到屍體，但他們找到了你的名字——出現在每一個失蹤者的通話紀錄裡。",
  "你不是兇手。但你需要證明這件事，在第九分局拿到逮捕令之前。",
  "你在中城區還有一點自由的時間。\n城市裡有人知道真相——找出他們，找出真正的兇手。",
];
const INTRO_FULL = INTRO_PARAGRAPHS.join("\n\n");
const TYPING_MS = 22;

// ── 危險等級顏色 ──────────────────────────────────────────────
const dangerColor: Record<string, string> = {
  low:    "#c9d6df",
  medium: "#ff9f1c",
  high:   "#ff2e63",
};

export default function GameHubPage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;
  const router    = useRouter();

  const [showIntro,      setShowIntro]      = useState(false);
  const [introDone,      setIntroDone]      = useState(false);
  const [typedLen,       setTypedLen]       = useState(0);
  const hasMounted = useRef(false);

  // ── 初始化：判斷是否要顯示開場白 ─────────────────────────────
  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;

    const key = `pez_seen_intro_${sessionId}`;
    const seen = localStorage.getItem(key);
    if (!seen) {
      setShowIntro(true);
    } else {
      setIntroDone(true);
    }
  }, [sessionId]);

  // ── 打字機效果 ─────────────────────────────────────────────
  useEffect(() => {
    if (!showIntro || introDone) return;
    if (typedLen >= INTRO_FULL.length) {
      setIntroDone(true);
      return;
    }
    const t = setTimeout(
      () => setTypedLen((n) => n + 1),
      TYPING_MS
    );
    return () => clearTimeout(t);
  }, [showIntro, introDone, typedLen]);

  const skipIntro = useCallback(() => {
    setTypedLen(INTRO_FULL.length);
    setIntroDone(true);
  }, []);

  function dismissIntro() {
    localStorage.setItem(`pez_seen_intro_${sessionId}`, "1");
    setShowIntro(false);
  }

  // ── 開場白畫面 ─────────────────────────────────────────────
  if (showIntro) {
    const displayed = INTRO_FULL.slice(0, typedLen);
    return (
      <div className="min-h-screen flex flex-col justify-center px-6 max-w-xl mx-auto">
        <div
          className="text-sm leading-[2] text-[#c9d6df]/80 whitespace-pre-wrap mb-10"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        >
          {displayed}
          {!introDone && (
            <span className="inline-block w-[2px] h-[1em] bg-[#c9d6df]/50 ml-0.5 animate-pulse align-middle" />
          )}
        </div>

        <div className="flex gap-3">
          {!introDone ? (
            <button
              onClick={skipIntro}
              className="text-xs text-[#c9d6df]/30 hover:text-[#c9d6df]/60 tracking-widest transition-colors"
            >
              略過
            </button>
          ) : (
            <button
              onClick={dismissIntro}
              className="px-6 py-2 border border-[#ff2e63]/50 text-[#ff2e63] text-sm tracking-widest hover:bg-[#ff2e63]/10 transition-colors rounded"
            >
              開始調查
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── 遊戲主畫面 ─────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto">
      {/* 頂部標題列 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#c9d6df]/10">
        <Link
          href="/game"
          className="text-xs text-[#c9d6df]/30 hover:text-[#c9d6df]/60 transition-colors tracking-wider"
        >
          ← 大廳
        </Link>
        <div className="text-center">
          <p
            className="text-xs tracking-widest text-[#c9d6df]/60"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            賽德里斯
          </p>
          <p className="text-[10px] text-[#c9d6df]/20 tracking-wide">P.E. 02　調查中</p>
        </div>
        <button
          onClick={() => router.push(`/game/${sessionId}/accuse`)}
          className="text-xs border border-[#ff2e63]/40 text-[#ff2e63]/70 px-3 py-1 rounded hover:bg-[#ff2e63]/10 transition-colors tracking-wide"
        >
          提出指控
        </button>
      </header>

      {/* 場景副標題 */}
      <div className="px-4 pt-5 pb-2">
        <p className="text-[10px] text-[#c9d6df]/25 tracking-[0.4em] uppercase mb-1">地點選擇</p>
        <p
          className="text-xs text-[#c9d6df]/40 leading-relaxed"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        >
          選擇一個地點進入，與在場的人對話，尋找線索。
        </p>
      </div>

      {/* 場景卡片 */}
      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
        {SCENES.map((scene) => {
          const danger = scene.dangerLevel ?? "low";
          const accentColor = dangerColor[danger];
          const canEnter = !scene.locked && scene.npcs.length > 0;

          return (
            <div
              key={scene.id}
              className={`border rounded p-4 transition-all ${
                canEnter
                  ? "border-[#c9d6df]/20 hover:border-[#c9d6df]/40 cursor-pointer"
                  : "border-[#c9d6df]/8 opacity-45"
              }`}
              onClick={() => {
                if (canEnter) {
                  router.push(`/game/${sessionId}/chat/${scene.npcs[0].id}`);
                }
              }}
            >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p
                    className="text-sm tracking-wider text-[#c9d6df]"
                    style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                  >
                    {scene.name}
                  </p>
                  <p className="text-[10px] tracking-widest mt-0.5" style={{ color: accentColor + "80" }}>
                    {scene.district}
                  </p>
                </div>
                {scene.locked ? (
                  <span className="text-[10px] text-[#c9d6df]/25 border border-[#c9d6df]/10 px-2 py-0.5 rounded tracking-wide">
                    {scene.lockReason ?? "鎖定"}
                  </span>
                ) : (
                  <span className="text-[10px] text-[#c9d6df]/40 tracking-wide">
                    →
                  </span>
                )}
              </div>

              <p
                className="text-xs text-[#c9d6df]/45 leading-relaxed my-2"
                style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
              >
                {scene.description}
              </p>

              {/* 底部：NPC + 氛圍 */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-1.5">
                  {scene.npcs.map((npc) => (
                    <span
                      key={npc.id}
                      className="text-[10px] text-[#c9d6df]/50 border border-[#c9d6df]/15 px-2 py-0.5 rounded"
                    >
                      {npc.name}
                    </span>
                  ))}
                  {scene.npcs.length === 0 && !scene.locked && (
                    <span className="text-[10px] text-[#c9d6df]/20">暫無人在場</span>
                  )}
                </div>
                <span
                  className="text-[10px] italic"
                  style={{ color: accentColor + "50", fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  {scene.ambience}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部說明 */}
      <div className="px-4 py-4 border-t border-[#c9d6df]/8 flex items-center justify-between">
        <p className="text-[10px] text-[#c9d6df]/20 tracking-wide">
          收集線索，建立信任，再做判斷。
        </p>
        <button
          onClick={() => router.push(`/game/${sessionId}/accuse`)}
          className="text-[11px] text-[#ff2e63]/60 hover:text-[#ff2e63]/90 tracking-widest transition-colors"
        >
          我有答案了 →
        </button>
      </div>
    </div>
  );
}
