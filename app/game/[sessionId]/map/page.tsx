"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SCENES } from "@/lib/scene-config";
import { STORAGE_KEYS, SCENE_PALETTE, DEFAULT_SCENE_PALETTE } from "@/lib/constants";

const DANGER_LABELS: Record<string, string> = {
  low:    "低危",
  medium: "中危",
  high:   "高危",
};

const DANGER_COLORS: Record<string, string> = {
  low:    "rgba(74,222,128,0.65)",
  medium: "rgba(251,146,60,0.65)",
  high:   "rgba(255,56,100,0.75)",
};

export default function MapPage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;
  const router    = useRouter();

  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const key  = STORAGE_KEYS.VISITED_SCENES(sessionId);
    const raw  = localStorage.getItem(key) ?? "";
    const ids  = new Set(raw.split(",").filter(Boolean));
    setVisitedIds(ids);
  }, [sessionId]);

  function handleEnterScene(sceneId: string) {
    const scene = SCENES.find((s) => s.id === sceneId);
    if (!scene || scene.npcs.length === 0) return;

    // 標記為已訪問
    const key     = STORAGE_KEYS.VISITED_SCENES(sessionId);
    const visited = new Set((localStorage.getItem(key) ?? "").split(",").filter(Boolean));
    visited.add(sceneId);
    localStorage.setItem(key, [...visited].join(","));

    router.push(`/game/${sessionId}/scene/${sceneId}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117]">
      <div className="fixed inset-0 bg-grid-static opacity-30 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex-1 max-w-xl mx-auto w-full px-5 pt-10 pb-16">

        {/* 頂部導覽 */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href={`/game/${sessionId}`}
            className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/55 tracking-widest transition-colors"
          >
            ← 返回
          </Link>
          <p className="font-mono-sys text-[9px] text-[#5bb8ff]/25 tracking-widest">
            MAP · SAIDRISS
          </p>
        </div>

        {/* 標題 */}
        <div className="mb-8">
          <h1
            className="text-lg tracking-widest text-[#e2c9a0]/85"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            賽德里斯地圖
          </h1>
          <p
            className="text-xs text-[#e2c9a0]/30 mt-1"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            {visitedIds.size} / {SCENES.length} 地點已探索
          </p>
        </div>

        {/* 探索進度條 */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-[#e2c9a0]/08 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#5bb8ff]/40 rounded-full transition-all duration-700"
              style={{ width: `${(visitedIds.size / SCENES.length) * 100}%` }}
            />
          </div>
          <span className="font-mono-sys text-[10px] text-[#5bb8ff]/35 tracking-widest shrink-0">
            {visitedIds.size}/{SCENES.length}
          </span>
        </div>

        {/* 場景卡片 2×2 格線 */}
        <div className="grid grid-cols-2 gap-3">
          {SCENES.map((scene) => {
            const visited = visitedIds.has(scene.id);
            const palette = SCENE_PALETTE[scene.id] ?? DEFAULT_SCENE_PALETTE;
            const danger  = scene.dangerLevel ?? "medium";

            return (
              <button
                key={scene.id}
                onClick={() => handleEnterScene(scene.id)}
                className="text-left p-4 rounded border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  borderColor: visited ? palette.borderHover : palette.border,
                  background:  visited ? palette.glow : "rgba(13,17,23,0.8)",
                  boxShadow:   visited
                    ? `0 0 18px ${palette.glow}, inset 0 0 12px ${palette.glow}`
                    : "none",
                }}
              >
                {/* 場景名稱 + 探訪指示器 */}
                <div className="flex items-start justify-between gap-1 mb-2">
                  <p
                    className="text-sm leading-tight"
                    style={{
                      fontFamily: "var(--font-noto-serif-tc), serif",
                      color:      visited
                        ? palette.accent
                        : "rgba(226,201,160,0.65)",
                    }}
                  >
                    {scene.name}
                  </p>
                  {visited && (
                    <span style={{ color: palette.accent }} className="text-xs shrink-0">
                      ◆
                    </span>
                  )}
                </div>

                {/* 區域 */}
                <p
                  className="font-mono-sys text-[8px] tracking-widest mb-3 truncate"
                  style={{ color: "rgba(226,201,160,0.28)" }}
                >
                  {scene.district}
                </p>

                {/* NPC 數量 */}
                <p
                  className="font-mono-sys text-[8px] tracking-widest mb-3"
                  style={{ color: "rgba(226,201,160,0.22)" }}
                >
                  {scene.npcs.length} 名目擊者
                </p>

                {/* 底部標籤列 */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* 危險等級 */}
                  <span
                    className="font-mono-sys text-[8px] px-1.5 py-0.5 rounded-sm border tracking-wide"
                    style={{
                      borderColor: `${DANGER_COLORS[danger]}40`,
                      color:       DANGER_COLORS[danger],
                      background:  `${DANGER_COLORS[danger]}10`,
                    }}
                  >
                    {DANGER_LABELS[danger]}
                  </span>

                  {/* 已訪問標籤 */}
                  {visited ? (
                    <span
                      className="font-mono-sys text-[8px] px-1.5 py-0.5 rounded-sm border tracking-wide"
                      style={{
                        borderColor: `${palette.accent}35`,
                        color:       `${palette.accent}80`,
                        background:  `${palette.accent}08`,
                      }}
                    >
                      已探索
                    </span>
                  ) : (
                    <span
                      className="font-mono-sys text-[8px] px-1.5 py-0.5 rounded-sm border tracking-wide"
                      style={{
                        borderColor: "rgba(226,201,160,0.10)",
                        color:       "rgba(226,201,160,0.25)",
                      }}
                    >
                      未探索
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 場景氛圍提示 */}
        <div className="mt-8 space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono-sys text-[9px] text-[#e2c9a0]/20 tracking-[0.4em] uppercase">地點概覽</span>
            <span className="flex-1 h-px bg-[#e2c9a0]/06" />
          </div>
          {SCENES.map((scene) => {
            const visited = visitedIds.has(scene.id);
            return (
              <div
                key={scene.id}
                className="flex items-baseline gap-2 py-1.5 border-b"
                style={{ borderColor: "rgba(226,201,160,0.05)" }}
              >
                <span
                  className="font-mono-sys text-[9px] shrink-0 w-20 tracking-wide"
                  style={{
                    color: visited
                      ? "rgba(226,201,160,0.55)"
                      : "rgba(226,201,160,0.22)",
                  }}
                >
                  {scene.name}
                </span>
                <span
                  className="text-[10px] leading-relaxed flex-1"
                  style={{
                    fontFamily: "var(--font-noto-serif-tc), serif",
                    color:      visited
                      ? "rgba(226,201,160,0.38)"
                      : "rgba(226,201,160,0.15)",
                  }}
                >
                  {scene.ambience}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
