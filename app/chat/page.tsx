"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

// ── 型別 ──────────────────────────────────────────────────────
type MessageRole = "user" | "npc";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
  isTyping?: boolean;
  typedLength?: number;
  isNew?: boolean;       // 控制 fade-in 動畫
}

interface NpcStateUI {
  trustLevel: number;
  conversationCount: number;
}

type LoadState = "idle" | "loading" | "ready" | "error";
type ErrorKind = "rate_limit" | "server_error" | "network" | null;

const NPC_ID    = "chen_jie";
const NPC_NAME  = "陳姐麵館";
const NPC_LOC   = "中城區　P.E. 02";
const TYPING_MS = 28;

// ── 工具函式 ──────────────────────────────────────────────────
function genId() { return Math.random().toString(36).slice(2, 10); }

function getGuestId(): string {
  const key = "pez_guest_id";
  let id = localStorage.getItem(key);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
  return id;
}

function getStoredSessionId(): string | null {
  return localStorage.getItem("pez_session_id");
}
function storeSessionId(id: string) {
  localStorage.setItem("pez_session_id", id);
}
function clearStoredSession() {
  localStorage.removeItem("pez_session_id");
}

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
export default function ChatPage() {
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [input,       setInput]       = useState("");
  const [sending,     setSending]     = useState(false);
  const [loadState,   setLoadState]   = useState<LoadState>("idle");
  const [errorKind,   setErrorKind]   = useState<ErrorKind>(null);
  const [sessionId,   setSessionId]   = useState<string | null>(null);
  const [guestId,     setGuestId]     = useState("");
  const [npcState,    setNpcState]    = useState<NpcStateUI>({ trustLevel: 0, conversationCount: 0 });

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const hasMounted = useRef(false);

  // ── 初始化：從 localStorage 恢復 session / 載入歷史 ────────
  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;

    const gid = getGuestId();
    setGuestId(gid);

    const storedSid = getStoredSessionId();
    if (storedSid) {
      loadHistory(storedSid, gid);
    } else {
      // 新訪客：直接顯示開場白
      setMessages([makeNpcMsg("坐啊，要吃什麼？今天的湯麵不錯。", false)]);
      setLoadState("ready");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadHistory(sid: string, gid: string) {
    setLoadState("loading");
    try {
      const res = await fetch(`/api/chat?sessionId=${sid}&npcId=${NPC_ID}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();

      if (!data.messages?.length) {
        // session 存在但無訊息（例：只建了 session 沒說話）
        setMessages([makeNpcMsg("坐啊，要吃什麼？今天的湯麵不錯。", false)]);
      } else {
        const restored: Message[] = data.messages.map((m: { role: string; content: string; created_at: string }) => ({
          id: genId(),
          role: m.role === "assistant" ? "npc" : "user",
          content: m.content,
          createdAt: new Date(m.created_at),
          isNew: false,
        }));
        setMessages(restored);
      }

      if (data.npcState) {
        setNpcState({
          trustLevel: data.npcState.trust_level ?? 0,
          conversationCount: data.npcState.conversation_count ?? 0,
        });
      }

      setSessionId(sid);
      void gid;
    } catch {
      // 歷史載入失敗，重新開始（不清 session）
      setMessages([makeNpcMsg("坐啊，要吃什麼？今天的湯麵不錯。", false)]);
    } finally {
      setLoadState("ready");
    }
  }

  // ── 打字機效果 ─────────────────────────────────────────────
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
    const t = setTimeout(() =>
      setMessages((prev) => prev.map((m) =>
        m.id === typing.id ? { ...m, typedLength: (m.typedLength ?? 0) + 1 } : m
      )),
      TYPING_MS
    );
    return () => clearTimeout(t);
  }, [messages]);

  // ── 自動滾到底 ─────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── 建立訊息物件 ────────────────────────────────────────────
  function makeNpcMsg(content: string, withTyping = true): Message {
    return {
      id: genId(),
      role: "npc",
      content,
      createdAt: new Date(),
      isTyping: withTyping,
      typedLength: withTyping ? 0 : undefined,
      isNew: true,
    };
  }

  // ── 傳送訊息 ────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Message = {
      id: genId(),
      role: "user",
      content: text,
      createdAt: new Date(),
      isNew: true,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setErrorKind(null);

    // 訊息歷史（只送 role + content）
    const allMessages = [...messages, userMsg].map(({ role, content }) => ({ role, content }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMessages,
          sessionId: sessionId ?? undefined,
          guestId,
          npcId: NPC_ID,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const kind = data.error === "rate_limit" ? "rate_limit" : "server_error";
        setErrorKind(kind);
        setMessages((prev) => [...prev, makeNpcMsg(
          kind === "rate_limit"
            ? "（陳姐暫時沒空，你等一下再來。）"
            : "（陳姐好像在想什麼，沒有回應。）",
          false
        )]);
        return;
      }

      // 記住 sessionId
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
        storeSessionId(data.sessionId);
      }

      // 更新信任度
      if (typeof data.newTrustLevel === "number") {
        setNpcState((prev) => ({
          trustLevel: data.newTrustLevel,
          conversationCount: prev.conversationCount + 1,
        }));
      }

      setMessages((prev) => [...prev, makeNpcMsg(data.reply, true)]);
    } catch {
      setErrorKind("network");
      setMessages((prev) => [...prev, makeNpcMsg(
        "（店裡訊號不好，陳姐的聲音斷了。）",
        false
      )]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, sending, messages, sessionId, guestId]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function resetConversation() {
    clearStoredSession();
    setSessionId(null);
    setNpcState({ trustLevel: 0, conversationCount: 0 });
    setMessages([makeNpcMsg("坐啊，要吃什麼？今天的湯麵不錯。", false)]);
    setErrorKind(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function getDisplayContent(msg: Message): string {
    if (!msg.isTyping) return msg.content;
    return msg.content.slice(0, msg.typedLength ?? 0);
  }

  const isTypingAnything = messages.some((m) => m.isTyping);

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* ── 標題列 ──────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#c9d6df]/10">
        <Link
          href="/"
          className="text-xs text-[#c9d6df]/40 hover:text-[#c9d6df]/70 transition-colors tracking-wider"
        >
          ← 賽德里斯
        </Link>

        <div className="text-center">
          <p
            className="text-sm tracking-widest"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            {NPC_NAME}
          </p>
          <p className="text-xs text-[#c9d6df]/30 tracking-wide">{NPC_LOC}</p>
        </div>

        {/* 信任度徽章 */}
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[10px] text-[#c9d6df]/30 tracking-wide">
            {trustLabel(npcState.trustLevel)}
          </span>
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-4 h-0.5 rounded-full transition-colors duration-500 ${
                  npcState.trustLevel >= (i + 1) * 20
                    ? "bg-[#ff2e63]"
                    : "bg-[#c9d6df]/15"
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* ── 對話區 ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">

        {/* 載入中 */}
        {loadState === "loading" && (
          <div className="flex justify-center py-8">
            <span className="text-xs text-[#c9d6df]/30 tracking-widest animate-pulse">
              讀取對話紀錄…
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
            <div className="flex flex-col gap-1 max-w-[75%]">
              <div
                className={`px-4 py-3 rounded text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[#ff2e63]/20 border border-[#ff2e63]/30 text-[#c9d6df]"
                    : "bg-[#c9d6df]/5 border border-[#c9d6df]/10 text-[#c9d6df]"
                }`}
                style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
              >
                {getDisplayContent(msg)}
                {msg.isTyping && (
                  <span className="inline-block w-[2px] h-[1em] bg-[#c9d6df]/50 ml-0.5 animate-pulse align-middle" />
                )}
              </div>
              {/* 時間戳 */}
              <span className={`text-[10px] text-[#c9d6df]/20 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                {formatTime(msg.createdAt)}
              </span>
            </div>
          </div>
        ))}

        {/* Gemini 等待動畫（三點跳動） */}
        {sending && !isTypingAnything && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded border border-[#c9d6df]/10 flex items-center gap-1.5">
              {[0, 150, 300].map((delay, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#c9d6df]/30 animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 錯誤橫幅 */}
        {errorKind && (
          <div className="flex justify-center">
            <span className="text-[11px] text-[#ff2e63]/60 border border-[#ff2e63]/20 px-3 py-1 rounded tracking-wide">
              {errorKind === "rate_limit"
                ? "API 請求頻率超限，請稍候再試"
                : errorKind === "network"
                ? "網路連線中斷，請確認後重試"
                : "伺服器暫時異常"}
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── 底部：操作列 ────────────────────────────────────── */}
      <div className="border-t border-[#c9d6df]/10">
        {/* 重新開始按鈕 */}
        <div className="flex justify-end px-4 pt-2">
          <button
            onClick={resetConversation}
            className="text-[10px] text-[#c9d6df]/25 hover:text-[#c9d6df]/50 transition-colors tracking-widest"
          >
            重新開始對話
          </button>
        </div>

        {/* 輸入框 */}
        <div className="px-4 pb-4 pt-1 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="說點什麼…"
            disabled={sending || loadState === "loading"}
            maxLength={300}
            className="flex-1 bg-transparent border border-[#c9d6df]/20 rounded px-3 py-2 text-sm text-[#c9d6df] placeholder-[#c9d6df]/20 focus:outline-none focus:border-[#c9d6df]/40 disabled:opacity-40 transition-colors"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim() || loadState === "loading"}
            className="px-4 py-2 rounded border border-[#ff2e63]/50 text-[#ff2e63] text-sm hover:bg-[#ff2e63]/10 active:bg-[#ff2e63]/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            送出
          </button>
        </div>
      </div>
    </div>
  );
}
