"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

type Message = {
  id: string;
  role: "user" | "npc";
  content: string;
  isTyping?: boolean;    // NPC 正在打字中（typewriter 效果）
  typedLength?: number;  // 已顯示到第幾個字
};

const CLUE =
  "那個失蹤的人上個月還在你這裡吃飯，吃完走的時候往反方向走了——那個方向沒有他家，也沒有他上班的地方。";

const TYPING_SPEED_MS = 35; // 每個字的間隔（ms），調小更快

function genId() {
  return Math.random().toString(36).slice(2);
}

/** 取得或建立訪客 ID（存在 localStorage） */
function getGuestId(): string {
  if (typeof window === "undefined") return "";
  const key = "pez_guest_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: genId(),
      role: "npc",
      content: "坐啊，要吃什麼？今天的湯麵不錯。",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [guestId, setGuestId] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setGuestId(getGuestId());
  }, []);

  // 打字機效果
  useEffect(() => {
    const typingMsg = messages.find((m) => m.isTyping);
    if (!typingMsg) return;

    const currentLen = typingMsg.typedLength ?? 0;
    if (currentLen >= typingMsg.content.length) {
      // 打字完成
      setMessages((prev) =>
        prev.map((m) =>
          m.id === typingMsg.id
            ? { ...m, isTyping: false, typedLength: undefined }
            : m
        )
      );
      return;
    }

    const timer = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === typingMsg.id
            ? { ...m, typedLength: (m.typedLength ?? 0) + 1 }
            : m
        )
      );
    }, TYPING_SPEED_MS);

    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: genId(), role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({
            role,
            content,
          })),
          clue: CLUE,
          conversationId: conversationId ?? undefined,
          guestId,
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();

      // 記住 conversationId，之後每輪對話都帶上
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      // 加入帶打字機效果的 NPC 訊息
      setMessages((prev) => [
        ...prev,
        {
          id: genId(),
          role: "npc",
          content: data.reply,
          isTyping: true,
          typedLength: 0,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: genId(), role: "npc", content: "（陳姐沉默地擦著桌子）" },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, loading, messages, conversationId, guestId]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function getDisplayContent(msg: Message) {
    if (!msg.isTyping) return msg.content;
    return msg.content.slice(0, msg.typedLength ?? 0);
  }

  function resetConversation() {
    setMessages([
      {
        id: genId(),
        role: "npc",
        content: "坐啊，要吃什麼？今天的湯麵不錯。",
      },
    ]);
    setConversationId(null);
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* 標題列 */}
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
            陳姐麵館
          </p>
          <p className="text-xs text-[#c9d6df]/30 tracking-wide">
            中城區　P.E. 02
          </p>
        </div>
        <button
          onClick={resetConversation}
          className="text-xs text-[#c9d6df]/30 hover:text-[#c9d6df]/60 transition-colors tracking-wider"
        >
          重新開始
        </button>
      </header>

      {/* 對話區 */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] px-4 py-3 rounded text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#ff2e63]/20 border border-[#ff2e63]/30 text-[#c9d6df]"
                  : "bg-[#c9d6df]/5 border border-[#c9d6df]/10 text-[#c9d6df]"
              }`}
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              {getDisplayContent(msg)}
              {/* 打字機游標 */}
              {msg.isTyping && (
                <span className="inline-block w-0.5 h-4 bg-[#c9d6df]/60 ml-0.5 animate-pulse align-middle" />
              )}
            </div>
          </div>
        ))}

        {/* API 等待中動畫 */}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded border border-[#c9d6df]/10 text-[#c9d6df]/40 text-sm flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms" }}>·</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms" }}>·</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 輸入區 */}
      <div className="px-4 py-3 border-t border-[#c9d6df]/10 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="說點什麼…"
          disabled={loading}
          className="flex-1 bg-transparent border border-[#c9d6df]/20 rounded px-3 py-2 text-sm text-[#c9d6df] placeholder-[#c9d6df]/20 focus:outline-none focus:border-[#c9d6df]/50 disabled:opacity-40"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="px-4 py-2 rounded border border-[#ff2e63]/50 text-[#ff2e63] text-sm hover:bg-[#ff2e63]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          送出
        </button>
      </div>
    </div>
  );
}
