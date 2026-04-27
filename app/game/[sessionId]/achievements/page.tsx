"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ACHIEVEMENTS,
  ACHIEVEMENTS_BY_CATEGORY,
  ACHIEVEMENT_CATEGORY_LABELS,
  TOTAL_ACHIEVEMENTS,
  type AchievementCategory,
} from "@/lib/content/achievements";
import { STORAGE_KEYS } from "@/lib/constants";

/**
 * /game/[sessionId]/achievements
 *
 * 成就列表頁面。
 * 從 localStorage 讀取已解鎖成就 ID，其餘未解鎖的顯示「???」。
 */
export default function AchievementsPage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;

  // 讀取已解鎖成就（跨局，使用固定鍵）
  const unlockedIds = useMemo((): Set<string> => {
    if (typeof window === "undefined") return new Set();
    const raw = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS) ?? "";
    return new Set(raw.split(",").filter(Boolean));
  }, []);

  const unlockedCount = ACHIEVEMENTS.filter((a) => unlockedIds.has(a.id)).length;
  const progress = Math.round((unlockedCount / TOTAL_ACHIEVEMENTS) * 100);

  const CATEGORY_ORDER: AchievementCategory[] = ["story", "explore", "collect", "hidden", "meta"];

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
            ← 返回地圖
          </Link>
          <p className="font-mono-sys text-[9px] text-[#5bb8ff]/25 tracking-widest">
            ACHIEVEMENTS
          </p>
        </div>

        {/* 標頭 + 總進度 */}
        <div className="mb-8">
          <h1
            className="text-lg tracking-widest text-[#e2c9a0]/85 mb-1"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            成就
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1 h-1 bg-[#e2c9a0]/08 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5bb8ff]/50 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-mono-sys text-[10px] text-[#5bb8ff]/45 tracking-widest shrink-0">
              {unlockedCount} / {TOTAL_ACHIEVEMENTS}
            </span>
          </div>
        </div>

        {/* 各類別 */}
        {CATEGORY_ORDER.map((cat) => {
          const items = ACHIEVEMENTS_BY_CATEGORY[cat];
          const catUnlocked = items.filter((a) => unlockedIds.has(a.id)).length;

          return (
            <div key={cat} className="mb-8">
              {/* 類別標題 */}
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono-sys text-[9px] text-[#5bb8ff]/30 tracking-[0.4em] uppercase">
                  {ACHIEVEMENT_CATEGORY_LABELS[cat]}
                </span>
                <span className="flex-1 h-px bg-[#5bb8ff]/08" />
                <span className="font-mono-sys text-[9px] text-[#e2c9a0]/20">
                  {catUnlocked}/{items.length}
                </span>
              </div>

              {/* 成就項目 */}
              <div className="space-y-2">
                {items.map((achievement) => {
                  const unlocked = unlockedIds.has(achievement.id);
                  const showContent = unlocked || !achievement.hidden;

                  return (
                    <div
                      key={achievement.id}
                      className="flex items-start gap-3 p-3 rounded border transition-colors duration-200"
                      style={{
                        borderColor: unlocked
                          ? "rgba(91,184,255,0.20)"
                          : "rgba(226,201,160,0.06)",
                        background: unlocked
                          ? "rgba(91,184,255,0.03)"
                          : "transparent",
                      }}
                    >
                      {/* 解鎖指示器 */}
                      <div className="mt-0.5 shrink-0">
                        {unlocked ? (
                          <span className="text-[#5bb8ff] text-xs">◆</span>
                        ) : (
                          <span className="text-[#e2c9a0]/15 text-xs">◇</span>
                        )}
                      </div>

                      {/* 文字 */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs mb-0.5"
                          style={{
                            fontFamily: "var(--font-noto-serif-tc), serif",
                            color:      unlocked
                              ? "rgba(226,201,160,0.85)"
                              : "rgba(226,201,160,0.30)",
                          }}
                        >
                          {showContent ? achievement.name : "???"}
                        </p>
                        <p
                          className="text-[10px] leading-relaxed"
                          style={{
                            fontFamily: "var(--font-noto-serif-tc), serif",
                            color:      unlocked
                              ? "rgba(226,201,160,0.45)"
                              : "rgba(226,201,160,0.15)",
                          }}
                        >
                          {showContent ? achievement.description : "解鎖後揭露"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
