"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { STORAGE_KEYS } from "@/lib/constants";

/**
 * /game/[sessionId]/name
 *
 * 開場流程：intro → name → identity → difficulty → 地圖
 * 完成後：
 *   1. 寫入 localStorage（STORAGE_KEYS.PLAYER_NAME）
 *   2. 導向 /game/[sessionId]/identity
 */
export default function NamePage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;
  const router    = useRouter();

  const [name,    setName]    = useState("");
  const [saving,  setSaving]  = useState(false);
  const [focused, setFocused] = useState(false);

  const trimmed = name.trim();

  function handleConfirm() {
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME(sessionId), trimmed);
    } catch { /* ignore */ }
    router.push(`/game/${sessionId}/identity`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && trimmed) handleConfirm();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117]">
      <div className="fixed inset-0 bg-grid-static opacity-40 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex-1 flex flex-col max-w-lg mx-auto w-full px-5 pt-14 pb-12">

        {/* 標頭 */}
        <div className="mb-10">
          <p className="font-mono-sys text-[10px] text-[#5bb8ff]/30 tracking-[0.4em] uppercase mb-3">
            身份登記
          </p>
          <h1
            className="text-xl tracking-widest text-[#e2c9a0]/90 mb-2"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            你叫什麼名字？
          </h1>
          <div className="h-px bg-gradient-to-r from-[#e2c9a0]/15 to-transparent" />
          <p
            className="mt-4 text-xs text-[#e2c9a0]/38 leading-relaxed"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            這個名字會在對話中使用。NPC 會這樣稱呼你。
            <br />
            <span className="text-[#e2c9a0]/22">你也可以選擇不填，以匿名身份進入。</span>
          </p>
        </div>

        {/* 輸入框 */}
        <div className="flex-1 flex flex-col gap-8">
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 20))}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="輸入名字（最多 20 字）"
              maxLength={20}
              autoFocus
              className="w-full bg-transparent py-4 px-0 text-base text-[#e2c9a0]/85 placeholder-[#e2c9a0]/18 border-b outline-none transition-colors duration-300"
              style={{
                fontFamily:  "var(--font-noto-serif-tc), serif",
                borderColor: focused
                  ? "rgba(226,201,160,0.45)"
                  : "rgba(226,201,160,0.15)",
              }}
            />
            {/* 字數 */}
            <span
              className="absolute right-0 bottom-4 font-mono-sys text-[10px] transition-colors"
              style={{ color: name.length >= 18 ? "rgba(255,56,100,0.55)" : "rgba(226,201,160,0.20)" }}
            >
              {name.length}/20
            </span>
          </div>

          {/* 提示文字：出現時機 */}
          <div
            className="text-[11px] leading-loose transition-opacity duration-500"
            style={{
              fontFamily: "var(--font-noto-serif-tc), serif",
              color:      "rgba(226,201,160,0.28)",
              opacity:    trimmed ? 1 : 0,
            }}
          >
            NPC 可能會在對話中直接稱呼你「{trimmed || ""}」。<br />
            也可能只叫你「你」。視乎他們和你的關係。
          </div>
        </div>

        {/* 按鈕區 */}
        <div className="mt-10 flex flex-col gap-3">
          <button
            onClick={handleConfirm}
            disabled={!trimmed || saving}
            className="w-full py-3.5 border text-sm tracking-[0.2em] transition-all duration-300 rounded disabled:opacity-30"
            style={{
              borderColor: trimmed ? "rgba(226,201,160,0.45)" : "rgba(226,201,160,0.15)",
              color:       trimmed ? "rgba(226,201,160,0.80)" : "rgba(226,201,160,0.30)",
            }}
          >
            {saving ? (
              <span className="font-mono-sys text-xs">LOADING...</span>
            ) : trimmed ? (
              `以「${trimmed}」進入賽德里斯`
            ) : (
              "輸入名字後繼續"
            )}
          </button>

          {/* 跳過 */}
          <button
            onClick={() => {
              try { localStorage.setItem(STORAGE_KEYS.PLAYER_NAME(sessionId), ""); } catch { /* ignore */ }
              router.push(`/game/${sessionId}/identity`);
            }}
            className="w-full py-2.5 text-[11px] tracking-widest transition-colors duration-200"
            style={{
              fontFamily: "var(--font-noto-serif-tc), serif",
              color:      "rgba(226,201,160,0.22)",
            }}
          >
            略過，以匿名身份進入
          </button>
        </div>

      </div>
    </div>
  );
}
