"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SCENES } from "@/lib/scene-config";
import { getSceneItems } from "@/lib/content/scene-items";
import { SceneCard } from "@/components/game/SceneCard";
import { STORAGE_KEYS } from "@/lib/constants";
import { getDifficulty, type DifficultyId } from "@/lib/content/difficulty";
import type { Scene } from "@/lib/scene-config";
import { FontSizeControl } from "@/components/ui/FontSizeControl";

export default function GameHubPage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;
  const router    = useRouter();

  const [showHub,           setShowHub]           = useState(false);
  const [identity,          setIdentity]          = useState<"normal" | "phase2">("normal");
  const [difficulty,        setDifficulty]        = useState<DifficultyId>("normal");
  const [currentAct,        setCurrentAct]        = useState(1);
  const [evValue,           setEvValue]           = useState(0);
  const [actJustAdvanced,   setActJustAdvanced]   = useState(false);
  // B2: 每個場景的已探索物件數量 { [sceneId]: count }
  const [sceneProgress,     setSceneProgress]     = useState<Record<string, number>>({});

  useEffect(() => {
    const storedIdentity   = localStorage.getItem(STORAGE_KEYS.IDENTITY(sessionId));
    const storedDifficulty = localStorage.getItem(STORAGE_KEYS.DIFFICULTY(sessionId));
    const storedAct        = localStorage.getItem(`pez_act_${sessionId}`);
    const storedEv         = localStorage.getItem(`pez_ev_${sessionId}`);

    if (storedIdentity === "phase2") setIdentity("phase2");
    if (storedDifficulty) setDifficulty(storedDifficulty as DifficultyId);
    if (storedAct) {
      const parsedAct = parseInt(storedAct, 10) || 1;
      if (parsedAct > 1 && currentAct === 1) setActJustAdvanced(true);
      setCurrentAct(parsedAct);
    }
    if (storedEv) setEvValue(parseInt(storedEv, 10) || 0);

    // B2: 讀取各場景探索進度
    const progress: Record<string, number> = {};
    for (const scene of SCENES) {
      const key = STORAGE_KEYS.SCENE_INTERACTED(sessionId, scene.id);
      const raw = localStorage.getItem(key) ?? "";
      const ids = raw.split(",").filter(Boolean);
      progress[scene.id] = ids.length;
    }
    setSceneProgress(progress);

    setShowHub(true);
  }, [sessionId]);

  function handleEnterScene(scene: Scene) {
    const key     = STORAGE_KEYS.VISITED_SCENES(sessionId);
    const visited = new Set((localStorage.getItem(key) ?? "").split(",").filter(Boolean));
    visited.add(scene.id);
    localStorage.setItem(key, [...visited].join(","));

    router.push(`/game/${sessionId}/scene/${scene.id}`);
  }

  if (!showHub) return null;

  const diffDef  = getDifficulty(difficulty);
  const isPhase2 = identity === "phase2";

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
            P.E. 02 &nbsp;·&nbsp; 第 {currentAct} 幕
          </p>
        </div>

        <button
          onClick={() => router.push(`/game/${sessionId}/accuse`)}
          className="font-mono-sys text-[10px] border border-[#ff3864]/35 text-[#ff3864]/65 px-3 py-1.5 rounded hover:bg-[#ff3864]/10 hover:border-[#ff3864]/60 hover:text-[#ff3864] transition-all duration-200 tracking-wide"
        >
          指控
        </button>
      </header>

      {/* 狀態列：難度 + 身份 + EV + 字體 + 成就 + 設定 */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-[#e2c9a0]/4">
        {/* 難度標籤 */}
        <span
          className="font-mono-sys text-[9px] px-2 py-0.5 rounded-sm border tracking-widest"
          style={{
            borderColor: `${diffDef.accentColor}40`,
            color:       `${diffDef.accentColor}90`,
          }}
        >
          {diffDef.name}
        </span>

        {/* 身份標籤 */}
        {isPhase2 ? (
          <span className="font-mono-sys text-[9px] px-2 py-0.5 rounded-sm border border-[#ff3864]/35 text-[#ff3864]/70 tracking-widest">
            第二相體
          </span>
        ) : (
          <span className="font-mono-sys text-[9px] px-2 py-0.5 rounded-sm border border-[#5bb8ff]/25 text-[#5bb8ff]/50 tracking-widest">
            一般人
          </span>
        )}

        {/* Route B EV 條（A4）*/}
        {isPhase2 && (
          <div className="flex items-center gap-1.5 ml-1">
            <span className="font-mono-sys text-[9px] text-[#ff3864]/45 tracking-widest">
              EV
            </span>
            <div className="w-16 h-1 bg-[#e2c9a0]/08 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width:      `${evValue}%`,
                  background: evValue > 80
                    ? "#ff3864"
                    : evValue > 50
                    ? "#f59e0b"
                    : "rgba(255,56,100,0.55)",
                }}
              />
            </div>
            <span className="font-mono-sys text-[9px] text-[#ff3864]/35">
              {evValue}
            </span>
          </div>
        )}

        <span className="flex-1" />

        {/* 字體調整 */}
        <FontSizeControl />

        {/* 設定（B3） */}
        <Link
          href={`/game/${sessionId}/settings`}
          className="font-mono-sys text-[9px] text-[#e2c9a0]/20 hover:text-[#e2c9a0]/50 tracking-widest transition-colors"
        >
          設定
        </Link>

        {/* 成就連結 */}
        <Link
          href={`/game/${sessionId}/achievements`}
          className="font-mono-sys text-[9px] text-[#e2c9a0]/20 hover:text-[#e2c9a0]/50 tracking-widest transition-colors"
        >
          成就
        </Link>
      </div>

      {/* A5: 幕次推進通知 */}
      {actJustAdvanced && (
        <div className="mx-4 mt-3 px-4 py-3 rounded border border-[#5bb8ff]/25 bg-[#5bb8ff]/05 animate-fade-in">
          <p className="font-mono-sys text-[10px] text-[#5bb8ff]/60 tracking-[0.3em] mb-1">
            CASE EVOLVING — 第二幕
          </p>
          <p
            className="text-xs text-[#e2c9a0]/55 leading-relaxed"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            你的調查已深入到足以改變事態的程度。BTMA 機構大廳現已開放。
          </p>
          <button
            onClick={() => setActJustAdvanced(false)}
            className="font-mono-sys text-[9px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/50 mt-2 tracking-widest"
          >
            收起 ×
          </button>
        </div>
      )}

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

      {/* 場景卡片 — B2: 加上探索進度 badge */}
      <div className="flex-1 px-4 py-2 space-y-3 overflow-y-auto">
        {SCENES.map((scene, idx) => {
          const totalItems   = getSceneItems(scene.id).length;
          const exploredCount = sceneProgress[scene.id] ?? 0;
          return (
            <div key={scene.id} className="relative">
              <SceneCard
                scene={scene}
                index={idx}
                onEnter={handleEnterScene}
              />
              {/* 探索進度 badge（B2）*/}
              {totalItems > 0 && (
                <span
                  className="absolute top-2 right-2 font-mono-sys text-[9px] tracking-widest px-1.5 py-0.5 rounded-sm border pointer-events-none"
                  style={{
                    borderColor: exploredCount >= totalItems
                      ? "rgba(74,222,128,0.35)"
                      : "rgba(226,201,160,0.12)",
                    color: exploredCount >= totalItems
                      ? "rgba(74,222,128,0.70)"
                      : "rgba(226,201,160,0.30)",
                    background: "rgba(13,17,23,0.85)",
                  }}
                >
                  {exploredCount}/{totalItems}
                </span>
              )}
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

      {/* 快速導覽列 */}
      <div className="px-4 pb-4 flex items-center justify-center gap-6 border-t border-[#e2c9a0]/4 pt-3">
        <Link
          href={`/game/${sessionId}/map`}
          className="flex flex-col items-center gap-0.5 group"
        >
          <span className="text-base opacity-40 group-hover:opacity-70 transition-opacity">🗺</span>
          <span className="font-mono-sys text-[8px] tracking-widest text-[#e2c9a0]/25 group-hover:text-[#e2c9a0]/55 transition-colors">
            地圖
          </span>
        </Link>
        <Link
          href={`/game/${sessionId}/clues`}
          className="flex flex-col items-center gap-0.5 group"
        >
          <span className="text-base opacity-40 group-hover:opacity-70 transition-opacity">🔍</span>
          <span className="font-mono-sys text-[8px] tracking-widest text-[#e2c9a0]/25 group-hover:text-[#e2c9a0]/55 transition-colors">
            線索
          </span>
        </Link>
        <Link
          href={`/game/${sessionId}/inventory`}
          className="flex flex-col items-center gap-0.5 group"
        >
          <span className="text-base opacity-40 group-hover:opacity-70 transition-opacity">🎒</span>
          <span className="font-mono-sys text-[8px] tracking-widest text-[#e2c9a0]/25 group-hover:text-[#e2c9a0]/55 transition-colors">
            道具
          </span>
        </Link>
        <Link
          href={`/game/${sessionId}/settings`}
          className="flex flex-col items-center gap-0.5 group"
        >
          <span className="text-base opacity-40 group-hover:opacity-70 transition-opacity">⚙️</span>
          <span className="font-mono-sys text-[8px] tracking-widest text-[#e2c9a0]/25 group-hover:text-[#e2c9a0]/55 transition-colors">
            設定
          </span>
        </Link>
      </div>
    </div>
  );
}
