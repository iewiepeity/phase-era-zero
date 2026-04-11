"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SCENES, DISTRICT_AREAS, getScenesByArea } from "@/lib/scene-config";
import type { Scene } from "@/lib/scene-config";
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

const AREA_ORDER: Scene["districtArea"][] = ["old_city", "central", "harbor", "academic"];

export default function MapPage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;
  const router    = useRouter();

  const [visitedIds,  setVisitedIds]  = useState<Set<string>>(new Set());
  const [currentAct,  setCurrentAct]  = useState(1);

  useEffect(() => {
    // Load visited scenes
    const key  = STORAGE_KEYS.VISITED_SCENES(sessionId);
    const raw  = localStorage.getItem(key) ?? "";
    setVisitedIds(new Set(raw.split(",").filter(Boolean)));

    // Load act from session (approximation via localStorage)
    const actKey = `pez_act_${sessionId}`;
    const act    = parseInt(localStorage.getItem(actKey) ?? "1", 10);
    setCurrentAct(isNaN(act) ? 1 : act);
  }, [sessionId]);

  function handleEnterScene(scene: Scene) {
    if (scene.locked && (scene.requiredAct ?? 1) > currentAct) return;

    const key     = STORAGE_KEYS.VISITED_SCENES(sessionId);
    const visited = new Set((localStorage.getItem(key) ?? "").split(",").filter(Boolean));
    visited.add(scene.id);
    localStorage.setItem(key, [...visited].join(","));

    router.push(`/game/${sessionId}/scene/${scene.id}`);
  }

  const scenesByArea = getScenesByArea();

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117]">
      <div className="fixed inset-0 bg-grid-static opacity-30 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex-1 max-w-xl mx-auto w-full px-5 pt-10 pb-20">

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
        <div className="mb-6">
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

        {/* 全域進度條 */}
        <div className="flex items-center gap-3 mb-10">
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

        {/* 按區域分組的場景 */}
        <div className="space-y-10">
          {AREA_ORDER.map((areaId) => {
            const area   = DISTRICT_AREAS[areaId];
            const scenes = scenesByArea[areaId];
            if (!scenes || scenes.length === 0) return null;

            const areaVisited = scenes.filter((s) => visitedIds.has(s.id)).length;

            return (
              <section key={areaId}>
                {/* 區域標題 */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="font-mono-sys text-[9px] tracking-[0.4em] uppercase"
                      style={{ color: `${area.accentColor}80` }}
                    >
                      {area.sublabel}
                    </span>
                    <span
                      className="text-sm tracking-widest"
                      style={{
                        fontFamily: "var(--font-noto-serif-tc), serif",
                        color:      `${area.accentColor}90`,
                      }}
                    >
                      {area.label}
                    </span>
                  </div>
                  <span className="flex-1 h-px" style={{ background: `${area.accentColor}18` }} />
                  <span
                    className="font-mono-sys text-[8px] shrink-0"
                    style={{ color: `${area.accentColor}40` }}
                  >
                    {areaVisited}/{scenes.length}
                  </span>
                </div>

                {/* 場景卡片 2 欄 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {scenes.map((scene) => {
                    const visited = visitedIds.has(scene.id);
                    const palette = SCENE_PALETTE[scene.id] ?? DEFAULT_SCENE_PALETTE;
                    const danger  = scene.dangerLevel ?? "medium";
                    const locked  = scene.locked && (scene.requiredAct ?? 1) > currentAct;

                    return (
                      <button
                        key={scene.id}
                        onClick={() => !locked && handleEnterScene(scene)}
                        disabled={locked}
                        className="text-left p-3.5 rounded border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                          borderColor: locked
                            ? "rgba(226,201,160,0.08)"
                            : visited
                            ? palette.borderHover
                            : palette.border,
                          background: locked
                            ? "rgba(13,17,23,0.4)"
                            : visited
                            ? palette.glow
                            : "rgba(13,17,23,0.8)",
                          boxShadow: visited && !locked
                            ? `0 0 14px ${palette.glow}, inset 0 0 10px ${palette.glow}`
                            : "none",
                        }}
                      >
                        {/* 場景名稱 */}
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <p
                            className="text-[13px] leading-tight"
                            style={{
                              fontFamily: "var(--font-noto-serif-tc), serif",
                              color: locked
                                ? "rgba(226,201,160,0.28)"
                                : visited
                                ? palette.accent
                                : "rgba(226,201,160,0.65)",
                            }}
                          >
                            {scene.name}
                          </p>
                          {locked ? (
                            <span className="font-mono-sys text-[10px] shrink-0 opacity-40">×</span>
                          ) : visited ? (
                            <span style={{ color: palette.accent }} className="text-xs shrink-0">◆</span>
                          ) : null}
                        </div>

                        {/* 簡短描述 */}
                        <p
                          className="text-[10px] leading-snug mb-2.5 line-clamp-2"
                          style={{
                            fontFamily: "var(--font-noto-serif-tc), serif",
                            color:      locked
                              ? "rgba(226,201,160,0.18)"
                              : "rgba(226,201,160,0.35)",
                          }}
                        >
                          {locked ? (scene.lockReason ?? "尚未解鎖") : scene.ambience}
                        </p>

                        {/* 底部標籤 */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* NPC 數量 */}
                          <span
                            className="font-mono-sys text-[8px] px-1.5 py-0.5 rounded-sm border tracking-wide"
                            style={{
                              borderColor: locked
                                ? "rgba(226,201,160,0.08)"
                                : `${palette.accent}20`,
                              color:       locked
                                ? "rgba(226,201,160,0.20)"
                                : `${palette.accent}55`,
                            }}
                          >
                            {scene.npcs.length}人
                          </span>

                          {/* 危險等級 */}
                          <span
                            className="font-mono-sys text-[8px] px-1.5 py-0.5 rounded-sm border tracking-wide"
                            style={{
                              borderColor: locked
                                ? "rgba(226,201,160,0.08)"
                                : `${DANGER_COLORS[danger]}35`,
                              color:       locked
                                ? "rgba(226,201,160,0.20)"
                                : DANGER_COLORS[danger],
                            }}
                          >
                            {DANGER_LABELS[danger]}
                          </span>

                          {/* 已訪問 / 未探索 */}
                          {!locked && (
                            visited ? (
                              <span
                                className="font-mono-sys text-[8px] px-1.5 py-0.5 rounded-sm border tracking-wide"
                                style={{
                                  borderColor: `${palette.accent}30`,
                                  color:       `${palette.accent}75`,
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
                            )
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* 圖例 */}
        <div className="mt-10 pt-6 border-t border-[#e2c9a0]/05">
          <div className="flex flex-wrap gap-4">
            {AREA_ORDER.map((areaId) => {
              const area = DISTRICT_AREAS[areaId];
              return (
                <div key={areaId} className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: `${area.accentColor}60` }}
                  />
                  <span
                    className="font-mono-sys text-[8px] tracking-widest"
                    style={{ color: `${area.accentColor}55` }}
                  >
                    {area.sublabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
