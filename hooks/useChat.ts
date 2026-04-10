"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getNpc } from "@/lib/npc-registry";
import { NPC_TYPING_MS } from "@/lib/constants";
import type { UiMessage, NpcStateUI, ChatErrorKind } from "@/lib/types";

type LoadState = "idle" | "loading" | "ready";

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

interface UseChatOptions {
  sessionId: string;
  npcId:     string;
}

interface UseChatReturn {
  messages:         UiMessage[];
  input:            string;
  setInput:         (v: string) => void;
  sending:          boolean;
  loadState:        LoadState;
  errorKind:        ChatErrorKind;
  npcState:         NpcStateUI;
  inputRef:         React.RefObject<HTMLInputElement | null>;
  bottomRef:        React.RefObject<HTMLDivElement | null>;
  sendMessage:      () => Promise<void>;
  handleKeyDown:    (e: React.KeyboardEvent<HTMLInputElement>) => void;
  getDisplayContent:(msg: UiMessage) => string;
  isTypingAnything: boolean;
}

/**
 * 對話頁面的完整狀態邏輯 hook。
 *
 * 負責：歷史載入、打字機動畫、送出訊息、信任度更新、錯誤處理、自動捲底。
 */
export function useChat({ sessionId, npcId }: UseChatOptions): UseChatReturn {
  const npc = getNpc(npcId);

  const [messages,  setMessages]  = useState<UiMessage[]>([]);
  const [input,     setInput]     = useState("");
  const [sending,   setSending]   = useState(false);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [errorKind, setErrorKind] = useState<ChatErrorKind>(null);
  const [npcState,  setNpcState]  = useState<NpcStateUI>({ trustLevel: 0, conversationCount: 0 });

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const hasMounted = useRef(false);

  // ── 建立 NPC 訊息物件 ──────────────────────────────────────
  function makeNpcMsg(content: string, withTyping = true): UiMessage {
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

  function getGreeting(): string {
    if (npcId === "chen_jie") return "坐啊，要吃什麼？今天的湯麵不錯。";
    return "……";
  }

  // ── 載入歷史 ───────────────────────────────────────────────
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

  // ── 初始化 ─────────────────────────────────────────────────
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

  // ── 打字機動畫 ─────────────────────────────────────────────
  useEffect(() => {
    const typing = messages.find((m) => m.isTyping);
    if (!typing) return;
    const len = typing.typedLength ?? 0;
    if (len >= typing.content.length) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === typing.id ? { ...m, isTyping: false, typedLength: undefined } : m
        )
      );
      return;
    }
    const t = setTimeout(
      () =>
        setMessages((prev) =>
          prev.map((m) =>
            m.id === typing.id ? { ...m, typedLength: (m.typedLength ?? 0) + 1 } : m
          )
        ),
      NPC_TYPING_MS,
    );
    return () => clearTimeout(t);
  }, [messages]);

  // ── 自動捲底 ───────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── 送出訊息 ───────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: UiMessage = {
      id:        genId(),
      role:      "user",
      content:   text,
      createdAt: new Date(),
      isNew:     true,
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
        const kind: ChatErrorKind = data.error === "rate_limit" ? "rate_limit" : "server_error";
        setErrorKind(kind);
        setMessages((prev) => [
          ...prev,
          makeNpcMsg(
            kind === "rate_limit"
              ? "（陳姐暫時沒空，你等一下再來。）"
              : "（陳姐好像在想什麼，沒有回應。）",
            false,
          ),
        ]);
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
      setMessages((prev) => [
        ...prev,
        makeNpcMsg("（店裡訊號不好，聲音斷了。）", false),
      ]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, sending, messages, sessionId, npcId]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function getDisplayContent(msg: UiMessage): string {
    return msg.isTyping ? msg.content.slice(0, msg.typedLength ?? 0) : msg.content;
  }

  void npc; // npc 供未來擴展使用（不同 NPC 可有不同預設行為）

  return {
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
    isTypingAnything: messages.some((m) => m.isTyping),
  };
}
