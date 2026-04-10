"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getNpc } from "@/lib/npc-registry";

// ── 型別 ──────────────────────────────────────────────────────
type MessageRole = "user" | "npc";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
  isTyping?: boolean;
  typedLength?: number;
  isNew?: boolean;
}

interface NpcStateUI {
  trustLevel: number;
  conversationCount: number;
}

type LoadState = "idle" | "loading" | "ready";
type ErrorKind = "rate_limit" | "server_error" | "network" | null;

const TYPING_MS = 26;

// ── NPC 視覺配色（未來可從 registry 擴展）────────────────────
const NPC_COLOR: Record<string, { dot: string; bubble: string; border: string }> = {
  chen_jie: {
    dot:    "#f59e0b",
    bubble: "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.18)",
  },
};

const DEFAULT_NPC_COLOR = {
  dot:    "#5bb8ff",
  bubble: "rgba(91,184,255,0.06)",
  border: "rgba(91,184,255,0.15)",
};

// ── 工具 ──────────────────────────────────────────────────────
function genId()   { return Math.random().toString(36).slice(2, 10); }

function formatTime(d: Date): string {
  return d.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });
}

function trustLabel(t: number): string {
  if (t < 15) return "陌生";
  if (t < 35) return "熟面孔";
  if (t < 60) return "可信";
  if (t < 85) return "知心";
  return "至交";
}

// ── 元件 ──────────────────────────────────────────────────────
export default function GameChatPage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;
  const npcId     = params.npcId     as string;

  const npc      = getNpc(npcId);
  const NPC_NAME = npc?.name     ?? npcId;
  const NPC_LOC  = npc?.location ?? "";
  const npcColor = NPC_COLOR[npcId] ?? DEFAULT_NPC_COLOR;

  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState("");
  const [sending,   setSending]   = useState(false);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);
  const [npcState,  setNpcState]  = useState<NpcStateUI>({ trustLevel: 0, conversationCount: 0 });

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const hasMounted = useRef(false);

  // ── 初始化 ────────────────────────────────────────────────────
  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;

    if (sessionId && sessionId !== "undefined") {
      loadHistory(sessionId);
    } else {
      setMessages([makeNpcMsg(getGreeting(), false)]);
      setLoadState("ready");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getGreeting(): string {
    if (npcId === "chen_jie") return "坐啊，要吃什麼？今天的湯麵不錯。";
    return "……";
  }

  async function loadHistory(sid: string) {
    setLoadState("loading");
    try {
      const res  = await fetch(`/api/chat?sessionId=${sid}&npcId=${npcId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();

      if (!data.messages?.length) {
        setMessages([makeNpcMsg(getGreeting(), false)]);
      } else {
        setMessages(
          data.messages.map((m: { role: string; content: string; created_at: string }) => ({
            id:        genId(),
            role:      m.role === "assistant" ? "npc" : "user",
            content:   m.content,
            createdAt: new Date(m.created_at),
            isNew:     false,
          }))
        );
      }
      if (data.npcState) {
        setNpcState({
          trustLevel:        data.npcState.trust_level       ?? 0,
          conversationCount: data.npcState.conversation_count ?? 0,
        });
      }
    } catch {
      setMessages([makeNpcMsg(getGreeting(), false)]);
    } finally {
      setLoadState("ready");
    }
  }

  // ── 打字機 ─────────────────────────────────────────────────
  useEffect(() => {
    const typing = messages.find((m) => m.isTyping);
    if (!typing) return;
    const len = typing.typedLength ?? 0;
    if (len >= typing.content.length) {
      setMessages((prev) => prev.map((m) =>
        m.id === typing.id ? { ...m, isTyping: false, typedLength: undefined } : m
      ));
      return;
    }
    const t = setTimeout(() => setMessages((prev) => prev.map((m) =>
      m.id === typing.id ? { ...m, typedLength: (m.typedLength ?? 0) + 1 } : m
    )), TYPING_MS);
    return () => clearTimeout(t);
  }, [messages]);

  // ── 自動滾底 ───────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── 建立 NPC 訊息 ─────────────────────────────────────────
  function makeNpcMsg(content: string, withTyping = true): Message {
    return {
      id:          genId(),
      role:        "npc",
      content,
      createdAt:   new Date(),
      isTyping:    withTyping,
      typedLength: withTyping ? 0 : undefined,
      isNew:       true,
    };
  }

  // ── 送出訊息 ──────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Message = {
      id: genId(), role: "user", content: text, createdAt: new Date(), isNew: true,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setErrorKind(null);

    const allMessages = [...messages, userMsg].map(({ role, content }) => ({ role, content }));

    try {
      const res  = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: allMessages, sessionId, npcId }),
      });
      const data = await res.json();

      if (!res.ok) {
        const kind = data.error === "rate_limit" ? "rate_limit" : "server_error";
        setErrorKind(kind);
        setMessages((prev) => [...prev, makeNpcMsg(
          kind === "rate_limit" ? "（陳姐暫時沒空，你等一下再來。）" : "（陳姐好像在想什麼，沒有回應。）",
          false
        )]);
        return;
      }

      if (typeof data.newTrustLevel === "number") {
        setNpcState((prev) => ({
          trustLevel:        data.newTrustLevel,
          conversationCount: prev.conversationCount + 1,
        }));
      }
      setMessages((prev) => [...prev, makeNpcMsg(data.reply, true)]);
    } catch {
      setErrorKind("network");
      setMessages((prev) => [...prev, makeNpcMsg("（店裡訊號不好，聲音斷了。）", false)]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, sending, messages, sessionId, npcId]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function getDisplayContent(msg: Message): string {
    return msg.isTyping ? msg.content.slice(0, msg.typedLength ?? 0) : msg.content;
  }

  const isTypingAnything = messages.some((m) => m.isTyping);
  const trustPercent     = Math.min(100, npcState.trustLevel);

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-[#0d1117]">

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

        {/* 信任度 */}
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono-sys text-[9px] tracking-widest" style={{ color: `${npcColor.dot}70` }}>
            {trustLabel(npcState.trustLevel)}
          </span>
          {/* 細進度條 */}
          <div className="w-14 h-[2px] rounded-full bg-[#e2c9a0]/8 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width:      `${trustPercent}%`,
                background: `linear-gradient(90deg, ${npcColor.dot}99, ${npcColor.dot})`,
                boxShadow:  `0 0 6px ${npcColor.dot}80`,
              }}
            />
          </div>
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
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} ${
              msg.isNew !== false ? "animate-fade-in" : ""
            }`}
          >
            {/* NPC 訊息 */}
            {msg.role === "npc" && (
              <div className="flex items-start gap-2.5 max-w-[80%]">
                {/* NPC 頭像點 */}
                <div className="shrink-0 mt-3">
                  <div
                    className="w-2 h-2 rounded-full mt-0.5"
                    style={{
                      background: npcColor.dot,
                      boxShadow:  `0 0 5px ${npcColor.dot}80`,
                    }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div
                    className="px-4 py-3 rounded-r-lg rounded-bl-lg text-sm leading-[1.9] whitespace-pre-wrap border"
                    style={{
                      fontFamily:  "var(--font-noto-serif-tc), serif",
                      color:       "#e2c9a0cc",
                      background:  npcColor.bubble,
                      borderColor: npcColor.border,
                    }}
                  >
                    {getDisplayContent(msg)}
                    {msg.isTyping && <span className="typing-cursor" />}
                  </div>
                  <span className="font-mono-sys text-[9px] text-[#e2c9a0]/18 pl-1">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            )}

            {/* 用戶訊息 */}
            {msg.role === "user" && (
              <div className="flex flex-col gap-1 items-end max-w-[75%]">
                <div
                  className="px-4 py-3 rounded-l-lg rounded-br-lg text-sm leading-[1.9] whitespace-pre-wrap border"
                  style={{
                    fontFamily:      "var(--font-noto-serif-tc), serif",
                    color:           "#e2c9a0cc",
                    background:      "rgba(255,56,100,0.06)",
                    borderColor:     "rgba(255,56,100,0.22)",
                  }}
                >
                  {getDisplayContent(msg)}
                </div>
                <span className="font-mono-sys text-[9px] text-[#e2c9a0]/18 pr-1">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            )}
          </div>
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
          style={{
            borderColor: `${npcColor.dot}60`,
            color:        npcColor.dot,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${npcColor.dot}15`; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          送出
        </button>
      </div>
    </div>
  );
}
