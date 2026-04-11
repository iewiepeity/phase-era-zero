"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getNpc } from "@/lib/npc-registry";
import { NPC_COLORS, DEFAULT_NPC_COLOR } from "@/lib/constants";
import type { ChatLogByNpc } from "@/app/api/game/chat-log/route";

// ── 主元件 ───────────────────────────────────────────────────

export default function ChatLogPage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;

  const [groups,    setGroups]    = useState<ChatLogByNpc[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const [query,     setQuery]     = useState("");
  const [activeNpc, setActiveNpc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/game/chat-log?sessionId=${sessionId}`);
        if (!res.ok) throw new Error("server_error");
        const { groups: g } = await res.json() as { groups: ChatLogByNpc[] };
        if (!cancelled) {
          setGroups(g ?? []);
          if (g && g.length > 0) setActiveNpc(g[0].npcId);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  // 過濾邏輯
  const filteredGroups = useMemo(() => {
    if (!query.trim()) return groups;
    const q = query.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        messages: g.messages.filter((m) => m.content.toLowerCase().includes(q)),
      }))
      .filter((g) => g.messages.length > 0);
  }, [groups, query]);

  const displayGroups = query.trim()
    ? filteredGroups
    : activeNpc
    ? groups.filter((g) => g.npcId === activeNpc)
    : groups;

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
          <p className="font-mono-sys text-[10px] text-[#5bb8ff]/40 tracking-[0.4em] uppercase">
            對話紀錄
          </p>
          <div className="w-14" />
        </header>

        {/* 搜尋列 */}
        <div className="px-4 py-2 border-b border-[#e2c9a0]/4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋對話內容…"
            className="w-full bg-[#111820] border border-[#e2c9a0]/10 rounded px-3 py-2 text-sm text-[#e2c9a0]/70 placeholder-[#e2c9a0]/20 focus:outline-none focus:border-[#e2c9a0]/22"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          />
        </div>

        {/* NPC 分頁列（搜尋時隱藏）*/}
        {!query.trim() && groups.length > 0 && (
          <div className="px-4 py-2 border-b border-[#e2c9a0]/4 flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveNpc(null)}
              className={`shrink-0 font-mono-sys text-[9px] tracking-widest px-2.5 py-1.5 rounded border transition-all ${
                activeNpc === null
                  ? "border-[#5bb8ff]/40 text-[#5bb8ff]/80 bg-[#5bb8ff]/08"
                  : "border-[#e2c9a0]/10 text-[#e2c9a0]/30 hover:border-[#e2c9a0]/22"
              }`}
            >
              全部
            </button>
            {groups.map((g) => {
              const npc   = getNpc(g.npcId);
              const color = NPC_COLORS[g.npcId] ?? DEFAULT_NPC_COLOR;
              const isActive = activeNpc === g.npcId;
              return (
                <button
                  key={g.npcId}
                  onClick={() => setActiveNpc(g.npcId)}
                  className={`shrink-0 flex items-center gap-1.5 font-mono-sys text-[9px] tracking-widest px-2.5 py-1.5 rounded border transition-all ${
                    isActive
                      ? "text-[#e2c9a0]/75"
                      : "border-[#e2c9a0]/10 text-[#e2c9a0]/30 hover:border-[#e2c9a0]/22"
                  }`}
                  style={isActive ? { borderColor: `${color.dot}50`, background: `${color.dot}08` } : undefined}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: color.dot }}
                  />
                  {npc?.name ?? g.npcId}
                  <span className="font-mono-sys text-[8px] opacity-50">
                    {g.messages.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 內容區 */}
        <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">

          {loading && (
            <div className="flex justify-center py-16">
              <span className="font-mono-sys text-[11px] text-[#e2c9a0]/28 tracking-widest animate-neon-pulse">
                LOADING...
              </span>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="font-mono-sys text-[11px] text-[#ff3864]/40 tracking-widest">
                無法載入對話記錄
              </p>
              <p
                className="text-xs text-[#e2c9a0]/25 text-center"
                style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
              >
                若尚未開始對話，或伺服器離線，此頁面將無內容。
              </p>
            </div>
          )}

          {!loading && !error && displayGroups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <p
                className="text-sm text-[#e2c9a0]/25"
                style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
              >
                {query.trim() ? "沒有符合的對話" : "還沒有對話記錄。"}
              </p>
            </div>
          )}

          {!loading && !error && displayGroups.map((g) => {
            const npc   = getNpc(g.npcId);
            const color = NPC_COLORS[g.npcId] ?? DEFAULT_NPC_COLOR;
            return (
              <div key={g.npcId}>
                {/* NPC 標題 */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: color.dot }}
                  />
                  <span
                    className="text-sm tracking-widest text-[#e2c9a0]/65"
                    style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                  >
                    {npc?.name ?? g.npcId}
                  </span>
                  {npc?.location && (
                    <span className="font-mono-sys text-[9px] tracking-widest" style={{ color: `${color.dot}60` }}>
                      {npc.location}
                    </span>
                  )}
                  <span className="flex-1 h-px" style={{ background: `${color.dot}18` }} />
                  <span className="font-mono-sys text-[9px] text-[#e2c9a0]/20">
                    {g.messages.length} 則
                  </span>
                </div>

                {/* 訊息列表 */}
                <div className="space-y-2 pl-4">
                  {g.messages.map((msg, i) => {
                    const isUser = msg.role === "user";
                    const highlight = query.trim()
                      ? highlightText(msg.content, query)
                      : msg.content;
                    return (
                      <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] px-3 py-2 rounded text-sm leading-relaxed ${
                            isUser
                              ? "bg-[#e2c9a0]/06 border border-[#e2c9a0]/12 text-[#e2c9a0]/65"
                              : "border text-[#e2c9a0]/60"
                          }`}
                          style={
                            isUser
                              ? undefined
                              : { borderColor: color.border, background: color.bubble }
                          }
                        >
                          <p
                            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                            dangerouslySetInnerHTML={{ __html: highlight }}
                          />
                          <p className="font-mono-sys text-[8px] text-[#e2c9a0]/20 mt-1 text-right">
                            {formatTime(msg.created_at)}
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
    </div>
  );
}

// ── 工具函式 ──────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

function highlightText(text: string, query: string): string {
  if (!query.trim()) return escapeHtml(text);
  const q   = escapeRegex(query.trim());
  const reg = new RegExp(`(${q})`, "gi");
  return escapeHtml(text).replace(reg, '<mark style="background:rgba(255,56,100,0.25);color:#ff3864;border-radius:2px;padding:0 1px;">$1</mark>');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
