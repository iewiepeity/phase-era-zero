"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getNewsForAct, type NewsArticle } from "@/lib/content/news-articles";

// ── 通話記錄（14 個失蹤者，11 個偽造）──────────────────────────

interface CallEntry {
  name:   string;
  time:   string;
  date:   string;
  forged: boolean;  // 偽造通話
}

const CALL_LOG: CallEntry[] = [
  // 3 個你真的認識的
  { name: "余霜",   time: "22:14", date: "02.03.28", forged: false },
  { name: "莊河",   time: "19:42", date: "02.03.29", forged: false },
  { name: "陳姐",   time: "08:31", date: "02.04.01", forged: false },
  // 11 個你不認識的（偽造）
  { name: "林正浩", time: "23:08", date: "02.03.27", forged: true },
  { name: "方雅琪", time: "21:55", date: "02.03.28", forged: true },
  { name: "謝文彬", time: "20:17", date: "02.03.29", forged: true },
  { name: "吳建民", time: "23:41", date: "02.03.30", forged: true },
  { name: "陳若蘭", time: "19:03", date: "02.03.31", forged: true },
  { name: "劉亦凡", time: "22:30", date: "02.04.01", forged: true },
  { name: "王曉明", time: "21:12", date: "02.04.02", forged: true },
  { name: "張美玲", time: "20:48", date: "02.04.02", forged: true },
  { name: "黃國強", time: "23:19", date: "02.04.03", forged: true },
  { name: "蔡淑芬", time: "22:05", date: "02.04.04", forged: true },
  { name: "李建宇", time: "21:37", date: "02.04.05", forged: true },
];

// ── SMS 訊息型別（從 DB 載入）──────────────────────────────────

interface SmsThread {
  npcId:    string;
  npcName:  string;
  lastMsg:  string;
  lastTime: string;
  unread:   boolean;
}

type Tab = "sms" | "news" | "calls";

// ── 新聞展開組件 ───────────────────────────────────────────────

function NewsCard({ article }: { article: NewsArticle }) {
  const [expanded, setExpanded] = useState(false);

  const tagLabel: Record<NewsArticle["tag"], string> = {
    breaking: "即時",
    report:   "報導",
    opinion:  "評論",
    official: "官方",
  };
  const tagColor: Record<NewsArticle["tag"], string> = {
    breaking: "#ff3864",
    report:   "#5bb8ff",
    opinion:  "#f59e0b",
    official: "#4ade80",
  };

  return (
    <div
      className="border-b border-[#e2c9a0]/08 py-4 cursor-pointer"
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="font-mono-sys text-[9px] px-1.5 py-0.5 rounded-sm border"
          style={{ color: tagColor[article.tag], borderColor: `${tagColor[article.tag]}40` }}
        >
          {tagLabel[article.tag]}
        </span>
        <span className="font-mono-sys text-[9px] text-[#e2c9a0]/25">{article.source}</span>
        <span className="font-mono-sys text-[9px] text-[#e2c9a0]/20 ml-auto">{article.date}</span>
      </div>
      <p
        className="text-sm text-[#e2c9a0]/75 leading-snug mb-1"
        style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
      >
        {article.title}
      </p>
      {!expanded && (
        <p
          className="text-[11px] text-[#e2c9a0]/38 leading-relaxed line-clamp-2"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        >
          {article.summary}
        </p>
      )}
      {expanded && (
        <div
          className="mt-3 text-[12px] text-[#e2c9a0]/60 leading-[1.9] whitespace-pre-wrap"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        >
          {article.content}
        </div>
      )}
      <p className="font-mono-sys text-[9px] text-[#5bb8ff]/30 mt-1.5">
        {expanded ? "▲ 收起" : "▼ 展開全文"}
      </p>
    </div>
  );
}

// ── 主頁面 ─────────────────────────────────────────────────────

export default function PhonePage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;

  const [tab,          setTab]         = useState<Tab>("sms");
  const [currentAct,   setCurrentAct]  = useState(1);
  const [smsThreads,   setSmsThreads]  = useState<SmsThread[]>([]);
  const [smsLoading,   setSmsLoading]  = useState(false);
  const [showCallNote, setShowCallNote] = useState(false);

  // 讀取當前幕次
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`pez_act_${sessionId}`);
      if (raw) setCurrentAct(parseInt(raw, 10) || 1);
    } catch { /* ignore */ }
  }, [sessionId]);

  // 載入 SMS（取各 NPC 最新一則）
  useEffect(() => {
    if (tab !== "sms") return;
    setSmsLoading(true);
    fetch(`/api/phone/sms?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.threads)) setSmsThreads(d.threads); })
      .catch(() => { /* 靜默失敗，顯示空狀態 */ })
      .finally(() => setSmsLoading(false));
  }, [tab, sessionId]);

  const news = getNewsForAct(currentAct);

  const TABS: { id: Tab; label: string; shortLabel: string }[] = [
    { id: "sms",   label: "訊息",   shortLabel: "SMS"  },
    { id: "news",  label: "新聞",   shortLabel: "NEWS" },
    { id: "calls", label: "通話記錄", shortLabel: "LOG"  },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117]">
      <div className="fixed inset-0 bg-grid-static opacity-30 pointer-events-none" aria-hidden="true" />

      {/* 頂部欄 */}
      <div className="relative z-10 sticky top-0 bg-[#0d1117]/95 border-b border-[#e2c9a0]/08 px-4 pt-10 pb-0">
        <div className="flex items-center justify-between mb-3">
          <Link
            href={`/game/${sessionId}`}
            className="font-mono-sys text-[10px] text-[#5bb8ff]/35 hover:text-[#5bb8ff]/65 tracking-widest transition-colors"
          >
            ← 返回
          </Link>
          <p className="font-mono-sys text-[10px] text-[#e2c9a0]/20 tracking-[0.3em]">
            PHONE &nbsp;·&nbsp; ACT {currentAct}
          </p>
        </div>

        {/* Tab 列 */}
        <div className="flex gap-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 py-2.5 text-center border-b-2 transition-all duration-200"
              style={{
                borderColor: tab === t.id ? "rgba(226,201,160,0.55)" : "transparent",
                color:       tab === t.id ? "rgba(226,201,160,0.80)" : "rgba(226,201,160,0.28)",
              }}
            >
              <span className="hidden sm:inline font-mono-sys text-[10px] tracking-widest">{t.label}</span>
              <span className="sm:hidden font-mono-sys text-[9px] tracking-widest">{t.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 內容區 */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">

        {/* ── SMS 標籤 ── */}
        {tab === "sms" && (
          <div>
            {smsLoading && (
              <p className="font-mono-sys text-[10px] text-[#5bb8ff]/30 text-center py-12 tracking-widest">
                LOADING...
              </p>
            )}
            {!smsLoading && smsThreads.length === 0 && (
              <div className="text-center py-16">
                <p
                  className="text-sm text-[#e2c9a0]/30 mb-2"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  沒有訊息
                </p>
                <p className="font-mono-sys text-[9px] text-[#e2c9a0]/15 tracking-wide">
                  與 NPC 對話後，訊息記錄會出現在這裡
                </p>
              </div>
            )}
            {!smsLoading && smsThreads.map((thread) => (
              <Link
                key={thread.npcId}
                href={`/game/${sessionId}/chat/${thread.npcId}`}
                className="flex items-start gap-3 py-3.5 border-b border-[#e2c9a0]/06 hover:bg-[#e2c9a0]/02 transition-colors"
              >
                {/* 頭像圓點 */}
                <div
                  className="w-9 h-9 rounded-full border shrink-0 flex items-center justify-center mt-0.5"
                  style={{ borderColor: "rgba(226,201,160,0.18)", background: "rgba(226,201,160,0.04)" }}
                >
                  <span
                    className="text-[11px]"
                    style={{ fontFamily: "var(--font-noto-serif-tc), serif", color: "rgba(226,201,160,0.55)" }}
                  >
                    {thread.npcName.slice(0, 1)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className="text-sm text-[#e2c9a0]/80"
                      style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                    >
                      {thread.npcName}
                    </span>
                    <span className="font-mono-sys text-[9px] text-[#e2c9a0]/22">{thread.lastTime}</span>
                  </div>
                  <p
                    className="text-[12px] text-[#e2c9a0]/40 truncate"
                    style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                  >
                    {thread.lastMsg}
                  </p>
                </div>
                {thread.unread && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff3864] shrink-0 mt-2" />
                )}
              </Link>
            ))}
          </div>
        )}

        {/* ── 新聞標籤 ── */}
        {tab === "news" && (
          <div>
            {news.length === 0 && (
              <div className="text-center py-16">
                <p
                  className="text-sm text-[#e2c9a0]/30"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  目前沒有新聞
                </p>
              </div>
            )}
            {news.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        )}

        {/* ── 通話記錄標籤 ── */}
        {tab === "calls" && (
          <div>
            {/* 警告橫幅 */}
            <div
              className="mb-4 p-3 rounded border"
              style={{ borderColor: "rgba(255,56,100,0.25)", background: "rgba(255,56,100,0.04)" }}
            >
              <p
                className="text-[11px] text-[#ff3864]/70 leading-relaxed"
                style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
              >
                以下通話記錄由警方取得，其中 11 筆被標記為「異常」——時間戳與基地台 ID 不一致。
              </p>
              <button
                onClick={() => setShowCallNote((v) => !v)}
                className="font-mono-sys text-[9px] text-[#5bb8ff]/40 mt-1.5 hover:text-[#5bb8ff]/70 transition-colors"
              >
                {showCallNote ? "▲ 收起" : "▼ 什麼是異常？"}
              </button>
              {showCallNote && (
                <p
                  className="text-[11px] text-[#e2c9a0]/40 leading-relaxed mt-2"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  正規通話記錄包含中繼站 ID 和封包確認碼。異常紀錄的格式只有時間和號碼，
                  缺少其他欄位，這是最容易偽造的格式。
                </p>
              )}
            </div>

            {/* 記錄列表 */}
            {CALL_LOG.map((entry, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-3 border-b border-[#e2c9a0]/06"
              >
                <div
                  className="w-7 h-7 rounded-full border shrink-0 flex items-center justify-center"
                  style={{
                    borderColor: entry.forged ? "rgba(255,56,100,0.30)" : "rgba(91,184,255,0.30)",
                    background:  entry.forged ? "rgba(255,56,100,0.04)" : "rgba(91,184,255,0.04)",
                  }}
                >
                  <span
                    className="text-[9px]"
                    style={{ color: entry.forged ? "rgba(255,56,100,0.60)" : "rgba(91,184,255,0.60)" }}
                  >
                    {entry.forged ? "!" : "✓"}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm"
                      style={{
                        fontFamily: "var(--font-noto-serif-tc), serif",
                        color: entry.forged ? "rgba(255,56,100,0.65)" : "rgba(226,201,160,0.75)",
                      }}
                    >
                      {entry.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-sys text-[9px] text-[#e2c9a0]/25">{entry.time}</span>
                      <span className="font-mono-sys text-[9px] text-[#e2c9a0]/18">{entry.date}</span>
                    </div>
                  </div>
                  {entry.forged && (
                    <p className="font-mono-sys text-[9px] text-[#ff3864]/40 mt-0.5">
                      FORMAT ANOMALY · 缺少中繼站 ID
                    </p>
                  )}
                </div>
              </div>
            ))}

            <p
              className="text-center text-[11px] text-[#e2c9a0]/20 mt-6 leading-relaxed"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              共 {CALL_LOG.length} 筆記錄 &nbsp;·&nbsp; {CALL_LOG.filter((e) => e.forged).length} 筆異常
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
