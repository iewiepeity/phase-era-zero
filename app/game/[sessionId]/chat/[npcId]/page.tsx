"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { getNpc } from "@/lib/npc-registry";
import { NPC_COLORS, DEFAULT_NPC_COLOR } from "@/lib/constants";
import { useChat } from "@/hooks/useChat";
import { ChatBubble } from "@/components/game/ChatBubble";
import { TrustBar } from "@/components/ui/TrustBar";
import { NPC_CHAT_OPTIONS } from "@/lib/content/action-options";
import { ActionPanel } from "@/components/game/ActionPanel";
import { FontSizeControl } from "@/components/ui/FontSizeControl";
import { TutorialOverlay } from "@/components/game/TutorialOverlay";

export default function GameChatPage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;
  const npcId     = params.npcId     as string;

  const npc      = getNpc(npcId);
  const NPC_NAME = npc?.name     ?? npcId;
  const NPC_LOC  = npc?.location ?? "";
  const npcColor = NPC_COLORS[npcId] ?? DEFAULT_NPC_COLOR;

  const {
    messages,
    input,
    setInput,
    sending,
    loadState,
    errorKind,
    npcState,
    inputRef,
    bottomRef,
    sendMessage,
    handleKeyDown,
    getDisplayContent,
    isTypingAnything,
    discoveredClue,
    clearDiscoveredClue,
  } = useChat({ sessionId, npcId });

  // Derive action options from trust level
  const npcOptions = NPC_CHAT_OPTIONS[npcId];
  const chatOptions = npcOptions
    ? npcState.trustLevel >= 70
      ? npcOptions.deep
      : npcState.trustLevel >= 30
      ? npcOptions.trusted
      : npcOptions.initial
    : [];

  return (
    <div className="flex flex-col h-dvh max-w-2xl mx-auto bg-[#0d1117]">

      {/* ── B1: 發現新線索 Toast ───────────────────────────── */}
      {discoveredClue && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-xs w-full mx-4 animate-fade-in"
          style={{ pointerEvents: "none" }}
        >
          <div
            className="border rounded px-4 py-3 flex items-start gap-3 shadow-lg"
            style={{
              background:  "rgba(13,17,23,0.97)",
              borderColor: `${npcColor.dot}50`,
              boxShadow:   `0 0 20px ${npcColor.dot}20`,
            }}
          >
            <span style={{ color: npcColor.dot }} className="font-mono-sys text-[11px] mt-0.5 shrink-0">◈</span>
            <div className="flex-1 min-w-0">
              <p className="font-mono-sys text-[10px] tracking-widest mb-1" style={{ color: npcColor.dot }}>
                發現新線索
              </p>
              <p
                className="text-xs text-[#e2c9a0]/70 leading-relaxed line-clamp-2"
                style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
              >
                {discoveredClue.text}
              </p>
            </div>
            <button
              style={{ pointerEvents: "auto" }}
              onClick={clearDiscoveredClue}
              className="shrink-0 font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/60 mt-0.5"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── 標題列 ───────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#e2c9a0]/6 shrink-0">
        <Link
          href={`/game/${sessionId}`}
          className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/60 tracking-widest transition-colors"
        >
          ← 返回
        </Link>

        {/* NPC 名稱 + 彩色點 */}
        <div className="text-center flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-neon-pulse"
              style={{ background: npcColor.dot, boxShadow: `0 0 6px ${npcColor.dot}` }}
            />
            <p
              className="text-sm tracking-widest text-[#e2c9a0]"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              {NPC_NAME}
            </p>
          </div>
          <p className="font-mono-sys text-[9px] tracking-widest" style={{ color: `${npcColor.dot}60` }}>
            {NPC_LOC}
          </p>
        </div>

        {/* 右側：信任度 + 字體調整 */}
        <div className="flex flex-col items-end gap-1">
          <TrustBar level={npcState.trustLevel} dotColor={npcColor.dot} />
          <FontSizeControl />
        </div>
      </header>

      {/* ── 對話區 ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">

        {/* 載入中 */}
        {loadState === "loading" && (
          <div className="flex justify-center py-10">
            <span className="font-mono-sys text-[11px] text-[#e2c9a0]/28 tracking-widest animate-neon-pulse">
              LOADING...
            </span>
          </div>
        )}

        {/* 訊息列表 */}
        {loadState !== "loading" && messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            role={msg.role}
            displayText={getDisplayContent(msg)}
            createdAt={msg.createdAt}
            isTyping={msg.isTyping}
            isNew={msg.isNew}
            npcColor={npcColor}
          />
        ))}

        {/* 等待三點動畫 */}
        {sending && !isTypingAnything && (
          <div className="flex justify-start pl-6">
            <div
              className="px-4 py-3 rounded-r-lg rounded-bl-lg border flex items-center gap-1.5"
              style={{ borderColor: npcColor.border, background: npcColor.bubble }}
            >
              {[0, 150, 300].map((delay, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: `${npcColor.dot}70`, animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 錯誤橫幅 */}
        {errorKind && (
          <div className="flex justify-center">
            <span className="font-mono-sys text-[10px] text-[#ff3864]/55 border border-[#ff3864]/15 px-3 py-1.5 rounded tracking-wide">
              {errorKind === "rate_limit"
                ? "請求頻率超限，請稍候再試"
                : errorKind === "network"
                ? "網路連線中斷"
                : "伺服器暫時異常"}
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── 行動建議 ─────────────────────────────────────── */}
      {chatOptions.length > 0 && (
        <div className="shrink-0 px-4 pb-2 pt-1">
          <ActionPanel
            options={chatOptions}
            accentColor={npcColor.dot}
            onChat={(text) => {
              setInput(text);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            label="問話建議"
          />
        </div>
      )}

      {/* ── 輸入列 ──────────────────────────────────────── */}
      <div className="shrink-0 border-t border-[#e2c9a0]/6 px-4 pb-4 pt-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="說點什麼…"
          disabled={sending || loadState === "loading"}
          maxLength={300}
          autoFocus
          className="flex-1 bg-[#111820] border border-[#e2c9a0]/12 rounded px-3 py-2.5 text-sm text-[#e2c9a0]/80 placeholder-[#e2c9a0]/18 focus:outline-none focus:border-[#e2c9a0]/28 disabled:opacity-40 transition-colors"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !input.trim() || loadState === "loading"}
          className="px-4 py-2.5 rounded border text-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ borderColor: `${npcColor.dot}60`, color: npcColor.dot }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${npcColor.dot}15`; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          送出
        </button>
      </div>

      {/* C5: 新手引導 */}
      <TutorialOverlay kind="chat" />
    </div>
  );
}
