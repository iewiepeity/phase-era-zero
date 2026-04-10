"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Message = {
  role: "user" | "npc";
  content: string;
};

const CLUE =
  "那個失蹤的人上個月還在你這裡吃飯，吃完走的時候往反方向走了——那個方向沒有他家，也沒有他上班的地方。";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "npc",
      content: "坐啊，要吃什麼？今天的湯麵不錯。",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          clue: CLUE,
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "npc", content: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "npc", content: "（陳姐沉默地擦著桌子）" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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
          <p className="text-xs text-[#c9d6df]/30 tracking-wide">中城區　P.E. 02</p>
        </div>
        <div className="w-16" />
      </header>

      {/* 對話區 */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
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
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded border border-[#c9d6df]/10 text-[#c9d6df]/30 text-sm">
              ⋯
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 輸入區 */}
      <div className="px-4 py-3 border-t border-[#c9d6df]/10 flex gap-2">
        <input
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
