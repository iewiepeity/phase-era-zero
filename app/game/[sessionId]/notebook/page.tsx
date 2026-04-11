"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { NPC_REGISTRY } from "@/lib/npc-registry";
import { STORAGE_KEYS } from "@/lib/constants";

// ── 全部 NPC 排序（按場景/登場順序）───────────────────────────

const ALL_NPCS = Object.values(NPC_REGISTRY) as {
  id: string; name: string; location: string;
}[];

// ── 型別 ──────────────────────────────────────────────────────

interface NpcNote {
  starred: boolean;
  memo:    string;
}

interface NotebookData {
  generalNotes: string;
  npcs:         Partial<Record<string, NpcNote>>;
}

const EMPTY_NOTEBOOK: NotebookData = { generalNotes: "", npcs: {} };

function loadNotebook(sessionId: string): NotebookData {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTEBOOK(sessionId));
    if (!raw) return EMPTY_NOTEBOOK;
    // 向後相容：舊資料可能用 suspects 鍵
    const parsed = JSON.parse(raw) as Partial<NotebookData & { suspects: NotebookData["npcs"] }>;
    return {
      generalNotes: parsed.generalNotes ?? "",
      npcs:         parsed.npcs ?? parsed.suspects ?? {},
    };
  } catch {
    return EMPTY_NOTEBOOK;
  }
}

function saveNotebook(sessionId: string, data: NotebookData) {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTEBOOK(sessionId), JSON.stringify(data));
  } catch { /* ignore */ }
}

// ── 主元件 ───────────────────────────────────────────────────

export default function NotebookPage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;

  const [data,       setData]       = useState<NotebookData>(EMPTY_NOTEBOOK);
  const [activeTab,  setActiveTab]  = useState<"general" | string>("general");
  const [mounted,    setMounted]    = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setData(loadNotebook(sessionId));
    setMounted(true);
  }, [sessionId]);

  // 自動儲存（debounce 500ms）
  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => {
      saveNotebook(sessionId, data);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);
    }, 500);
    return () => clearTimeout(t);
  }, [data, mounted, sessionId]);

  const setGeneralNotes = useCallback((v: string) =>
    setData((d) => ({ ...d, generalNotes: v })), []);

  const toggleStar = useCallback((id: string) =>
    setData((d) => ({
      ...d,
      npcs: {
        ...d.npcs,
        [id]: { starred: !(d.npcs[id]?.starred ?? false), memo: d.npcs[id]?.memo ?? "" },
      },
    })), []);

  const setNpcMemo = useCallback((id: string, memo: string) =>
    setData((d) => ({
      ...d,
      npcs: {
        ...d.npcs,
        [id]: { starred: d.npcs[id]?.starred ?? false, memo },
      },
    })), []);

  if (!mounted) return null;

  const starredCount = ALL_NPCS.filter((n) => data.npcs[n.id]?.starred).length;

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto bg-[#0d1117]">
      <div className="fixed inset-0 bg-grid-static opacity-20 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* 標題列 */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-[#e2c9a0]/6">
          <Link
            href={`/game/${sessionId}`}
            className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/60 tracking-widest transition-colors"
          >
            ← 返回
          </Link>
          <div className="text-center">
            <p className="font-mono-sys text-[10px] text-[#5bb8ff]/40 tracking-[0.4em] uppercase">
              推理筆記本
            </p>
          </div>
          <span
            className={`font-mono-sys text-[9px] tracking-widest transition-opacity duration-300 ${savedFlash ? "text-[#4ade80]/60 opacity-100" : "opacity-0"}`}
          >
            已儲存
          </span>
        </header>

        {/* NPC 分頁列 */}
        <div className="px-4 py-2 border-b border-[#e2c9a0]/4 flex items-center gap-1.5 overflow-x-auto">
          {/* 全局筆記 tab */}
          <button
            onClick={() => setActiveTab("general")}
            className={`shrink-0 font-mono-sys text-[9px] tracking-widest px-2.5 py-1.5 rounded border transition-all ${
              activeTab === "general"
                ? "border-[#5bb8ff]/40 text-[#5bb8ff]/80 bg-[#5bb8ff]/08"
                : "border-[#e2c9a0]/10 text-[#e2c9a0]/30 hover:border-[#e2c9a0]/22"
            }`}
          >
            全局
          </button>

          {ALL_NPCS.map((npc) => {
            const starred = data.npcs[npc.id]?.starred ?? false;
            const hasMemo = (data.npcs[npc.id]?.memo ?? "").trim().length > 0;
            return (
              <button
                key={npc.id}
                onClick={() => setActiveTab(npc.id)}
                className={`shrink-0 flex items-center gap-1 font-mono-sys text-[9px] tracking-widest px-2.5 py-1.5 rounded border transition-all ${
                  activeTab === npc.id
                    ? "border-[#ff3864]/40 text-[#ff3864]/80 bg-[#ff3864]/06"
                    : "border-[#e2c9a0]/10 text-[#e2c9a0]/30 hover:border-[#e2c9a0]/22"
                }`}
              >
                {starred ? "★" : hasMemo ? "✎" : ""}
                {npc.name}
              </button>
            );
          })}
        </div>

        {/* 內容區 */}
        <div className="flex-1 px-4 py-5 overflow-y-auto">

          {/* 全局筆記 */}
          {activeTab === "general" && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono-sys text-[10px] text-[#5bb8ff]/40 tracking-[0.35em] uppercase">
                    全局推理筆記
                  </span>
                  <span className="flex-1 h-px bg-[#5bb8ff]/10" />
                </div>
                <textarea
                  value={data.generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder={"在這裡記錄你的推理思路、時間線、可疑細節……\n\n任何你認為重要的東西都可以寫下來。"}
                  rows={14}
                  className="w-full bg-[#111820] border border-[#e2c9a0]/10 rounded px-4 py-3 text-sm text-[#e2c9a0]/75 placeholder-[#e2c9a0]/18 focus:outline-none focus:border-[#e2c9a0]/22 resize-none leading-loose"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                />
              </div>

              {/* 標記摘要 */}
              {starredCount > 0 && (
                <div className="border border-[#e2c9a0]/8 rounded p-4 bg-[#0d1117]/70">
                  <p className="font-mono-sys text-[9px] text-[#e2c9a0]/30 tracking-widest mb-3">
                    ★ 重點關注 ({starredCount})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_NPCS.filter((n) => data.npcs[n.id]?.starred).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => setActiveTab(n.id)}
                        className="font-mono-sys text-[9px] px-2.5 py-1 rounded border border-[#ff3864]/30 text-[#ff3864]/65 hover:bg-[#ff3864]/08 transition-colors tracking-wide"
                      >
                        ★ {n.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 提示（混淆身份）*/}
              <p
                className="text-[11px] text-[#e2c9a0]/18 leading-relaxed"
                style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
              >
                每個人都有自己的秘密。你的工作是找出那個秘密背後還藏著什麼。
              </p>
            </div>
          )}

          {/* NPC 詳細備忘 */}
          {activeTab !== "general" && (() => {
            const npc  = NPC_REGISTRY[activeTab];
            if (!npc) return null;
            const note = data.npcs[activeTab] ?? { starred: false, memo: "" };
            return (
              <div className="space-y-5">
                {/* NPC 資訊 */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2
                      className="text-lg tracking-widest text-[#e2c9a0]/85 mb-0.5"
                      style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                    >
                      {npc.name}
                    </h2>
                    <p className="font-mono-sys text-[10px] text-[#e2c9a0]/30 tracking-widest">
                      {npc.location}
                    </p>
                  </div>

                  {/* 星標按鈕 */}
                  <button
                    onClick={() => toggleStar(activeTab)}
                    className={`shrink-0 w-12 h-12 rounded-full border flex items-center justify-center text-xl transition-all duration-200 ${
                      note.starred
                        ? "border-[#ff3864]/50 bg-[#ff3864]/10 text-[#ff3864]"
                        : "border-[#e2c9a0]/12 text-[#e2c9a0]/20 hover:border-[#e2c9a0]/25"
                    }`}
                  >
                    {note.starred ? "★" : "☆"}
                  </button>
                </div>

                {/* 備忘欄 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono-sys text-[10px] text-[#5bb8ff]/40 tracking-[0.35em] uppercase">
                      備忘
                    </span>
                    <span className="flex-1 h-px bg-[#5bb8ff]/10" />
                  </div>
                  <textarea
                    value={note.memo}
                    onChange={(e) => setNpcMemo(activeTab, e.target.value)}
                    placeholder={`關於 ${npc.name} 的可疑之處、說的話、前後矛盾的細節……`}
                    rows={12}
                    className="w-full bg-[#111820] border border-[#e2c9a0]/10 rounded px-4 py-3 text-sm text-[#e2c9a0]/75 placeholder-[#e2c9a0]/18 focus:outline-none focus:border-[#e2c9a0]/22 resize-none leading-loose"
                    style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                  />
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
