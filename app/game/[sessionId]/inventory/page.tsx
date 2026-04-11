"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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

  const [items,   setItems]   = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

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
            <span className="w-8 h-8 rounded border border-[#e2c9a0]/15" />
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
            {items.map((item) => (
              <div
                key={item.item_id}
                className="flex items-start gap-4 p-4 rounded border transition-colors duration-200"
                style={{
                  borderColor: "rgba(226,201,160,0.10)",
                  background:  "rgba(226,201,160,0.02)",
                }}
              >
                {/* 圖示 */}
                <div
                  className="shrink-0 w-10 h-10 rounded flex items-center justify-center text-lg"
                  style={{ background: "rgba(226,201,160,0.06)" }}
                >
                  <span className="w-5 h-5 rounded-sm border border-[#e2c9a0]/20" />
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

                    {/* 來源 NPC 標籤 */}
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

                    {/* 來源場景標籤 */}
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
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
