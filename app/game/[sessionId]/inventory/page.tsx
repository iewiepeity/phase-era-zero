"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { findItemCombination, type ItemCombinationRecipe } from "@/lib/content/item-combinations";

interface InventoryItem {
  id:            string;
  item_id:       string;
  item_name:     string;
  description:   string;
  source_npc?:   string | null;
  source_scene?: string | null;
  icon?:         string | null;
  obtained_at:   string;
}

export default function InventoryPage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;

  const [items,        setItems]        = useState<InventoryItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  // 組合模式
  const [combineMode,  setCombineMode]  = useState(false);
  const [firstItem,    setFirstItem]    = useState<InventoryItem | null>(null);
  const [combineResult, setCombineResult] = useState<ItemCombinationRecipe | null>(null);
  const [noMatch,      setNoMatch]      = useState(false);

  useEffect(() => {
    async function fetchInventory() {
      try {
        const res  = await fetch(`/api/game/inventory?sessionId=${sessionId}`);
        const data = await res.json();
        setItems(data.items ?? []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    fetchInventory();
  }, [sessionId]);

  function handleUseItem(item: InventoryItem) {
    setCombineMode(true);
    setFirstItem(item);
    setNoMatch(false);
  }

  function handleCombineSecond(second: InventoryItem) {
    if (!firstItem) return;
    const result = findItemCombination(firstItem.item_id, second.item_id);
    if (result) {
      setCombineResult(result);
    } else {
      setNoMatch(true);
    }
    setCombineMode(false);
    setFirstItem(null);
  }

  function cancelCombine() {
    setCombineMode(false);
    setFirstItem(null);
    setNoMatch(false);
  }

  function dismissResult() {
    setCombineResult(null);
    setNoMatch(false);
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
            INVENTORY
          </p>
        </div>

        {/* 標題 */}
        <div className="mb-8">
          <h1
            className="text-lg tracking-widest text-[#e2c9a0]/85"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            道具欄
          </h1>
          <p
            className="text-xs text-[#e2c9a0]/30 mt-1"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            {loading ? "讀取中…" : `${items.length} 件物品`}
          </p>
        </div>

        {/* 組合模式提示列 */}
        {combineMode && firstItem && (
          <div className="mb-4 px-4 py-3 rounded border border-[#f59e0b]/30 bg-[#f59e0b]/05 flex items-center gap-3">
            <span className="text-lg shrink-0">{firstItem.icon ?? "📦"}</span>
            <div className="flex-1 min-w-0">
              <p className="font-mono-sys text-[9px] text-[#f59e0b]/60 tracking-[0.3em] mb-0.5">組合模式</p>
              <p
                className="text-xs text-[#e2c9a0]/65 truncate"
                style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
              >
                選擇第二件道具與「{firstItem.item_name}」組合
              </p>
            </div>
            <button
              onClick={cancelCombine}
              className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/55 shrink-0"
            >
              取消
            </button>
          </div>
        )}

        {/* 分隔線 */}
        <div className="flex items-center gap-2 mb-6">
          <span className="flex-1 h-px bg-[#e2c9a0]/08" />
        </div>

        {/* 載入中 */}
        {loading && (
          <div className="flex justify-center py-16">
            <span className="font-mono-sys text-[10px] text-[#e2c9a0]/25 tracking-widest animate-pulse">
              LOADING…
            </span>
          </div>
        )}

        {/* 空狀態 */}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3">
            <span className="text-3xl opacity-30">📦</span>
            <p
              className="text-sm text-[#e2c9a0]/30 text-center"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              你的口袋是空的。
            </p>
            <p
              className="text-xs text-[#e2c9a0]/18 text-center"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              和更多人對話，也許會找到有用的東西。
            </p>
          </div>
        )}

        {/* 道具卡片格線 */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 gap-3">
            {items.map((item) => {
              const isFirst    = firstItem?.item_id === item.item_id;
              const isSelectable = combineMode && !isFirst;

              return (
                <div
                  key={item.item_id}
                  className="flex items-start gap-4 p-4 rounded border transition-all duration-200"
                  style={{
                    borderColor: isFirst
                      ? "rgba(245,158,11,0.40)"
                      : isSelectable
                      ? "rgba(91,184,255,0.20)"
                      : "rgba(226,201,160,0.10)",
                    background:  isFirst
                      ? "rgba(245,158,11,0.06)"
                      : isSelectable
                      ? "rgba(91,184,255,0.03)"
                      : "rgba(226,201,160,0.02)",
                  }}
                >
                  {/* 圖示 */}
                  <div
                    className="shrink-0 w-10 h-10 rounded flex items-center justify-center text-lg"
                    style={{ background: "rgba(226,201,160,0.06)" }}
                  >
                    {item.icon ?? "📦"}
                  </div>

                  {/* 內容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p
                        className="text-sm text-[#e2c9a0]/85"
                        style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                      >
                        {item.item_name}
                      </p>

                      {item.source_npc && (
                        <span
                          className="font-mono-sys text-[9px] px-1.5 py-0.5 rounded-sm border tracking-wide"
                          style={{
                            borderColor: "rgba(91,184,255,0.25)",
                            color:       "rgba(91,184,255,0.65)",
                            background:  "rgba(91,184,255,0.06)",
                          }}
                        >
                          {item.source_npc}
                        </span>
                      )}

                      {item.source_scene && !item.source_npc && (
                        <span
                          className="font-mono-sys text-[9px] px-1.5 py-0.5 rounded-sm border tracking-wide"
                          style={{
                            borderColor: "rgba(226,201,160,0.15)",
                            color:       "rgba(226,201,160,0.45)",
                            background:  "rgba(226,201,160,0.04)",
                          }}
                        >
                          {item.source_scene}
                        </span>
                      )}
                    </div>

                    <p
                      className="text-xs text-[#e2c9a0]/45 leading-relaxed"
                      style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                    >
                      {item.description}
                    </p>
                  </div>

                  {/* 動作按鈕 */}
                  <div className="shrink-0">
                    {combineMode && !isFirst ? (
                      <button
                        onClick={() => handleCombineSecond(item)}
                        className="font-mono-sys text-[9px] px-2.5 py-1.5 rounded border border-[#5bb8ff]/30 text-[#5bb8ff]/60 hover:bg-[#5bb8ff]/10 hover:border-[#5bb8ff]/50 transition-all tracking-widest"
                      >
                        選擇
                      </button>
                    ) : !combineMode ? (
                      <button
                        onClick={() => handleUseItem(item)}
                        className="font-mono-sys text-[9px] px-2.5 py-1.5 rounded border border-[#e2c9a0]/12 text-[#e2c9a0]/30 hover:border-[#f59e0b]/35 hover:text-[#f59e0b]/60 transition-all tracking-widest"
                      >
                        使用
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 組合成功 Modal */}
      {combineResult && (
        <>
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" onClick={dismissResult} />
          <div
            className="fixed bottom-0 left-0 right-0 z-[51] max-w-xl mx-auto rounded-t-2xl px-6 pt-6 pb-8"
            style={{ background: "#111827", borderTop: "1px solid rgba(245,158,11,0.30)" }}
          >
            <div className="w-10 h-1 rounded-full bg-[#e2c9a0]/15 mx-auto mb-5" />
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono-sys text-[9px] text-[#f59e0b]/55 tracking-[0.3em]">組合發現</span>
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]/60" />
            </div>
            <h2
              className="text-base tracking-widest text-[#e2c9a0]/85 mb-3"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              {combineResult.title}
            </h2>
            <p
              className="text-sm text-[#e2c9a0]/60 leading-loose mb-6"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              {combineResult.description}
            </p>
            <button
              onClick={dismissResult}
              className="w-full py-3 rounded border border-[#f59e0b]/35 text-[#f59e0b]/65 font-mono-sys text-xs tracking-widest hover:bg-[#f59e0b]/08 transition-colors"
            >
              記錄這個發現
            </button>
          </div>
        </>
      )}

      {/* 組合失敗提示 */}
      {noMatch && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={dismissResult} />
          <div
            className="fixed bottom-0 left-0 right-0 z-[51] max-w-xl mx-auto rounded-t-2xl px-6 pt-6 pb-8"
            style={{ background: "#111827", borderTop: "1px solid rgba(226,201,160,0.12)" }}
          >
            <div className="w-10 h-1 rounded-full bg-[#e2c9a0]/15 mx-auto mb-5" />
            <p
              className="text-sm text-[#e2c9a0]/40 text-center leading-loose mb-5"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              這兩件東西組合在一起，似乎沒有特別的意義。
            </p>
            <button
              onClick={dismissResult}
              className="w-full py-3 rounded border border-[#e2c9a0]/10 text-[#e2c9a0]/30 font-mono-sys text-xs tracking-widest hover:border-[#e2c9a0]/20 hover:text-[#e2c9a0]/50 transition-colors"
            >
              關閉
            </button>
          </div>
        </>
      )}
    </div>
  );
}
