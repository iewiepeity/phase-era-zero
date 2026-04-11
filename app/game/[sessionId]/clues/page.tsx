"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface PlayerClue {
  id:            string;
  clue_id:       string;
  clue_text:     string;
  clue_type:     "npc" | "scene" | "deduced";
  source_npc?:   string | null;
  source_scene?: string | null;
  category:      "relationship" | "motive" | "method" | "alibi" | "general";
  discovered_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  relationship: "關係",
  motive:       "動機",
  method:       "手法",
  alibi:        "不在場",
  general:      "一般",
};

const CATEGORY_COLORS: Record<string, { border: string; color: string; bg: string }> = {
  relationship: { border: "rgba(192,132,252,0.30)", color: "rgba(192,132,252,0.75)", bg: "rgba(192,132,252,0.06)" },
  motive:       { border: "rgba(255,56,100,0.30)",  color: "rgba(255,56,100,0.75)",  bg: "rgba(255,56,100,0.05)"  },
  method:       { border: "rgba(251,146,60,0.30)",  color: "rgba(251,146,60,0.75)",  bg: "rgba(251,146,60,0.05)"  },
  alibi:        { border: "rgba(91,184,255,0.30)",  color: "rgba(91,184,255,0.75)",  bg: "rgba(91,184,255,0.05)"  },
  general:      { border: "rgba(226,201,160,0.15)", color: "rgba(226,201,160,0.45)", bg: "rgba(226,201,160,0.03)" },
};

const CATEGORY_ORDER: PlayerClue["category"][] = [
  "motive",
  "method",
  "alibi",
  "relationship",
  "general",
];

export default function CluesPage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;

  const [clues,     setClues]     = useState<PlayerClue[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState<Set<string>>(new Set());
  const [combining, setCombining] = useState(false);
  const [newClueId, setNewClueId] = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);

  const fetchClues = useCallback(async () => {
    try {
      const res  = await fetch(`/api/game/clues?sessionId=${sessionId}`);
      const data = await res.json();
      setClues(data.clues ?? []);
    } catch {
      setClues([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchClues();
  }, [fetchClues]);

  function toggleSelect(clueId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(clueId)) {
        next.delete(clueId);
      } else if (next.size < 3) {
        next.add(clueId);
      }
      return next;
    });
  }

  async function handleCombine() {
    if (selected.size < 2 || selected.size > 3) return;
    setCombining(true);
    setError(null);

    try {
      const res  = await fetch("/api/game/clues/combine", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ sessionId, clueIds: [...selected] }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "合併失敗，請稍後再試。");
        return;
      }

      // 清空選取，重新拉取線索，高亮新線索
      setSelected(new Set());
      setNewClueId(data.clue?.clue_id ?? null);
      await fetchClues();

      // 3 秒後移除高亮
      setTimeout(() => setNewClueId(null), 4000);
    } catch {
      setError("網路錯誤，請稍後再試。");
    } finally {
      setCombining(false);
    }
  }

  // 分組（deduced 類型的線索另外顯示）
  const regularClues = clues.filter((c) => c.clue_type !== "deduced");
  const deducedClues = clues.filter((c) => c.clue_type === "deduced");

  const grouped = CATEGORY_ORDER.reduce<Record<string, PlayerClue[]>>((acc, cat) => {
    const items = regularClues.filter((c) => c.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  const canCombine = selected.size >= 2 && selected.size <= 3;

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117]">
      <div className="fixed inset-0 bg-grid-static opacity-30 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex-1 max-w-xl mx-auto w-full px-5 pt-10 pb-24">

        {/* 頂部導覽 */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href={`/game/${sessionId}`}
            className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/55 tracking-widest transition-colors"
          >
            ← 返回
          </Link>
          <p className="font-mono-sys text-[9px] text-[#5bb8ff]/25 tracking-widest">
            CLUES
          </p>
        </div>

        {/* 標題 */}
        <div className="mb-8">
          <h1
            className="text-lg tracking-widest text-[#e2c9a0]/85"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            線索板
          </h1>
          <p
            className="text-xs text-[#e2c9a0]/30 mt-1"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            {loading ? "讀取中…" : `${clues.length} 條線索`}
          </p>
        </div>

        {/* 載入中 */}
        {loading && (
          <div className="flex justify-center py-16">
            <span className="font-mono-sys text-[10px] text-[#e2c9a0]/25 tracking-widest animate-pulse">
              LOADING…
            </span>
          </div>
        )}

        {/* ── Section A：已知線索 ── */}
        {!loading && (
          <>
            {regularClues.length === 0 && deducedClues.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <span className="text-3xl opacity-20">🔍</span>
                <p
                  className="text-sm text-[#e2c9a0]/30 text-center"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  你還沒有收集到任何線索。
                </p>
                <p
                  className="text-xs text-[#e2c9a0]/18 text-center"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  去找人說說話吧。
                </p>
              </div>
            ) : (
              <>
                {/* 操作提示 */}
                {regularClues.length >= 2 && (
                  <div
                    className="mb-5 px-3 py-2 rounded border text-[10px]"
                    style={{
                      borderColor: "rgba(91,184,255,0.15)",
                      background:  "rgba(91,184,255,0.03)",
                      color:       "rgba(91,184,255,0.50)",
                      fontFamily:  "var(--font-noto-serif-tc), serif",
                    }}
                  >
                    選取 2-3 條線索，點擊「分析選取的線索」，讓推理引擎歸納新線索。
                  </div>
                )}

                {/* 分類線索 */}
                {CATEGORY_ORDER.map((cat) => {
                  const items = grouped[cat];
                  if (!items) return null;
                  const catColor = CATEGORY_COLORS[cat];

                  return (
                    <div key={cat} className="mb-7">
                      {/* 類別標題 */}
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className="font-mono-sys text-[9px] tracking-[0.4em] uppercase"
                          style={{ color: catColor.color }}
                        >
                          {CATEGORY_LABELS[cat]}
                        </span>
                        <span
                          className="flex-1 h-px"
                          style={{ background: catColor.border }}
                        />
                        <span className="font-mono-sys text-[9px] text-[#e2c9a0]/20">
                          {items.length}
                        </span>
                      </div>

                      {/* 線索列表 */}
                      <div className="space-y-2">
                        {items.map((clue) => {
                          const isSelected = selected.has(clue.clue_id);
                          return (
                            <button
                              key={clue.clue_id}
                              onClick={() => toggleSelect(clue.clue_id)}
                              className="w-full text-left p-3 rounded border transition-all duration-200"
                              style={{
                                borderColor: isSelected
                                  ? "rgba(91,184,255,0.45)"
                                  : catColor.border,
                                background: isSelected
                                  ? "rgba(91,184,255,0.07)"
                                  : catColor.bg,
                                boxShadow: isSelected
                                  ? "0 0 10px rgba(91,184,255,0.10)"
                                  : "none",
                              }}
                            >
                              <div className="flex items-start gap-2">
                                {/* 選取指示器 */}
                                <span
                                  className="shrink-0 mt-0.5 text-xs"
                                  style={{
                                    color: isSelected
                                      ? "rgba(91,184,255,0.90)"
                                      : "rgba(226,201,160,0.15)",
                                  }}
                                >
                                  {isSelected ? "◆" : "◇"}
                                </span>

                                <div className="flex-1 min-w-0">
                                  {/* 來源標籤 */}
                                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                    {clue.source_npc && (
                                      <span
                                        className="font-mono-sys text-[8px] px-1.5 py-0.5 rounded-sm border tracking-wide"
                                        style={{
                                          borderColor: "rgba(91,184,255,0.20)",
                                          color:       "rgba(91,184,255,0.55)",
                                          background:  "rgba(91,184,255,0.05)",
                                        }}
                                      >
                                        {clue.source_npc}
                                      </span>
                                    )}
                                    {clue.source_scene && (
                                      <span
                                        className="font-mono-sys text-[8px] px-1.5 py-0.5 rounded-sm border tracking-wide"
                                        style={{
                                          borderColor: "rgba(226,201,160,0.12)",
                                          color:       "rgba(226,201,160,0.38)",
                                        }}
                                      >
                                        {clue.source_scene}
                                      </span>
                                    )}
                                    <span
                                      className="font-mono-sys text-[8px] px-1.5 py-0.5 rounded-sm border tracking-wide"
                                      style={{
                                        borderColor: catColor.border,
                                        color:       catColor.color,
                                        background:  catColor.bg,
                                      }}
                                    >
                                      {CATEGORY_LABELS[clue.category]}
                                    </span>
                                  </div>

                                  <p
                                    className="text-xs leading-relaxed"
                                    style={{
                                      fontFamily: "var(--font-noto-serif-tc), serif",
                                      color:      "rgba(226,201,160,0.75)",
                                    }}
                                  >
                                    {clue.clue_text}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* ── 推理線索（deduced）── */}
                {deducedClues.length > 0 && (
                  <div className="mb-7">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="font-mono-sys text-[9px] tracking-[0.4em] uppercase"
                        style={{ color: "rgba(255,56,100,0.65)" }}
                      >
                        推理結論
                      </span>
                      <span className="flex-1 h-px bg-[#ff3864]/20" />
                      <span className="font-mono-sys text-[9px] text-[#e2c9a0]/20">
                        {deducedClues.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {deducedClues.map((clue) => {
                        const isNew = clue.clue_id === newClueId;
                        return (
                          <div
                            key={clue.clue_id}
                            className="p-3 rounded border transition-all duration-700"
                            style={{
                              borderColor: isNew
                                ? "rgba(255,56,100,0.55)"
                                : "rgba(255,56,100,0.25)",
                              background: isNew
                                ? "rgba(255,56,100,0.08)"
                                : "rgba(255,56,100,0.04)",
                              boxShadow: isNew
                                ? "0 0 16px rgba(255,56,100,0.12)"
                                : "none",
                            }}
                          >
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span
                                className="font-mono-sys text-[8px] px-1.5 py-0.5 rounded-sm border tracking-wide"
                                style={{
                                  borderColor: "rgba(255,56,100,0.30)",
                                  color:       "rgba(255,56,100,0.70)",
                                  background:  "rgba(255,56,100,0.06)",
                                }}
                              >
                                推理
                              </span>
                              {isNew && (
                                <span
                                  className="font-mono-sys text-[8px] px-1.5 py-0.5 rounded-sm border tracking-wide animate-pulse"
                                  style={{
                                    borderColor: "rgba(255,56,100,0.45)",
                                    color:       "rgba(255,56,100,0.85)",
                                    background:  "rgba(255,56,100,0.10)",
                                  }}
                                >
                                  NEW
                                </span>
                              )}
                            </div>
                            <p
                              className="text-xs leading-relaxed"
                              style={{
                                fontFamily: "var(--font-noto-serif-tc), serif",
                                color:      "rgba(226,201,160,0.80)",
                              }}
                            >
                              {clue.clue_text}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

      </div>

      {/* ── Section B：線索合併（底部固定工具列）── */}
      {!loading && regularClues.length >= 2 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-20 border-t"
          style={{
            borderColor: "rgba(226,201,160,0.08)",
            background:  "rgba(13,17,23,0.95)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="max-w-xl mx-auto px-5 py-4">
            {/* 已選取提示 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono-sys text-[9px] text-[#e2c9a0]/30 tracking-widest">
                  梳理線索
                </span>
                <span
                  className="font-mono-sys text-[9px] px-1.5 py-0.5 rounded-sm border tracking-wide"
                  style={{
                    borderColor: canCombine
                      ? "rgba(91,184,255,0.35)"
                      : "rgba(226,201,160,0.12)",
                    color: canCombine
                      ? "rgba(91,184,255,0.70)"
                      : "rgba(226,201,160,0.30)",
                  }}
                >
                  {selected.size} / 3 條已選
                </span>
              </div>

              {selected.size > 0 && (
                <button
                  onClick={() => setSelected(new Set())}
                  className="font-mono-sys text-[9px] tracking-widest transition-colors"
                  style={{ color: "rgba(226,201,160,0.25)" }}
                >
                  清除
                </button>
              )}
            </div>

            {/* 錯誤訊息 */}
            {error && (
              <p
                className="text-[10px] mb-2 text-center"
                style={{
                  fontFamily: "var(--font-noto-serif-tc), serif",
                  color:      "rgba(255,56,100,0.70)",
                }}
              >
                {error}
              </p>
            )}

            {/* 分析按鈕 */}
            <button
              onClick={handleCombine}
              disabled={!canCombine || combining}
              className="w-full py-3 rounded border font-mono-sys text-xs tracking-widest transition-all duration-200"
              style={{
                borderColor: canCombine && !combining
                  ? "rgba(255,56,100,0.45)"
                  : "rgba(226,201,160,0.10)",
                color: canCombine && !combining
                  ? "rgba(255,56,100,0.85)"
                  : "rgba(226,201,160,0.22)",
                background: canCombine && !combining
                  ? "rgba(255,56,100,0.06)"
                  : "transparent",
                cursor: canCombine && !combining ? "pointer" : "not-allowed",
              }}
            >
              {combining ? "推理中…" : "分析選取的線索"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
