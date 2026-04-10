"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SCENES } from "@/lib/scene-config";
import { STORAGE_KEYS, INTRO_TYPING_MS } from "@/lib/constants";
import { useTypewriter } from "@/hooks/useTypewriter";
import { SceneCard } from "@/components/game/SceneCard";
import type { Scene } from "@/lib/scene-config";

// ── 開場敘述文本 ──────────────────────────────────────────────
const INTRO_FULL = `P.E. 02 年，賽德里斯，中城區。

第十四名失蹤者昨晚消失。

警方沒有找到屍體，但他們找到了你的名字——出現在每一個失蹤者的通話紀錄裡。

你不是兇手。但你需要證明這件事，在第九分局拿到逮捕令之前。

你在中城區還有一點自由的時間。城市裡有人知道真相——找出他們，找出真正的兇手。`;

export default function GameHubPage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;
  const router    = useRouter();

  const [showIntro, setShowIntro] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [showHub,   setShowHub]   = useState(false);

  const hasMounted = useRef(false);

  const { displayed, isDone, skip } = useTypewriter({
    text:    INTRO_FULL,
    speed:   INTRO_TYPING_MS,
    enabled: showIntro && !introDone,
  });

  // isDone 由打字機回報，同步 introDone 狀態
  useEffect(() => {
    if (isDone && showIntro) setIntroDone(true);
  }, [isDone, showIntro]);

  // ── 初始化 ────────────────────────────────────────────────
  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;

    const seen = localStorage.getItem(STORAGE_KEYS.SEEN_INTRO(sessionId));
    if (!seen) {
      setShowIntro(true);
    } else {
      setShowHub(true);
    }
  }, [sessionId]);

  const skipIntro = useCallback(() => {
    skip();
    setIntroDone(true);
  }, [skip]);

  function dismissIntro() {
    localStorage.setItem(STORAGE_KEYS.SEEN_INTRO(sessionId), "1");
    setShowIntro(false);
    setShowHub(true);
  }

  function handleEnterScene(scene: Scene) {
    if (scene.npcs.length > 0) {
      router.push(`/game/${sessionId}/chat/${scene.npcs[0].id}`);
    }
  }

  // ── 開場白畫面 ────────────────────────────────────────────
  if (showIntro) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0d1117]">
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
            {displayed}
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

  // ── 遊戲主畫面 ────────────────────────────────────────────
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
        {SCENES.map((scene, idx) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            index={idx}
            onEnter={handleEnterScene}
          />
        ))}
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
