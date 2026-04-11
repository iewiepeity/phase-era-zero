"use client";

import { useState, useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/constants";

export type TutorialKind = "scene" | "chat";

interface TutorialStep {
  emoji:  string;
  title:  string;
  body:   string;
}

const SCENE_STEPS: TutorialStep[] = [
  { emoji: "👁",  title: "檢查物件", body: "點擊場景中的任何物品，可以查看詳細說明並收集線索。" },
  { emoji: "💬", title: "與人對話", body: "點擊 NPC（人物）可進入對話模式，深入詢問目擊資訊。" },
  { emoji: "🔍", title: "收集線索", body: "每個場景都藏有線索。蒐集夠多，就能找到真相。" },
];

const CHAT_STEPS: TutorialStep[] = [
  { emoji: "✍️", title: "自由輸入",  body: "你可以在下方輸入任何問題，NPC 會根據目前信任度回答。" },
  { emoji: "💡", title: "問話建議", body: "上方的建議問題已為你整理好切入點，點擊即可直接使用。" },
  { emoji: "📈", title: "建立信任",  body: "信任度越高，NPC 說的話越直接，隱藏的資訊也會浮現。" },
];

const storageKey = (kind: TutorialKind): string =>
  kind === "scene" ? STORAGE_KEYS.TUTORIAL_SCENE : STORAGE_KEYS.TUTORIAL_CHAT;

// ── 主元件 ───────────────────────────────────────────────────

interface TutorialOverlayProps {
  kind: TutorialKind;
}

export function TutorialOverlay({ kind }: TutorialOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [step,    setStep]    = useState(0);

  const steps = kind === "scene" ? SCENE_STEPS : CHAT_STEPS;

  useEffect(() => {
    try {
      const seen = localStorage.getItem(storageKey(kind));
      if (!seen) setVisible(true);
    } catch { /* ignore */ }
  }, [kind]);

  function dismiss() {
    try { localStorage.setItem(storageKey(kind), "seen"); } catch { /* ignore */ }
    setVisible(false);
  }

  function next() {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }

  if (!visible) return null;

  const current = steps[step];

  return (
    <>
      {/* 半透明背景 */}
      <div
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={dismiss}
      />

      {/* 提示卡 */}
      <div
        className="fixed bottom-24 left-4 right-4 z-[61] max-w-sm mx-auto rounded-xl px-6 pt-6 pb-5 animate-fade-in"
        style={{ background: "#111827", border: "1px solid rgba(91,184,255,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 步驟點 */}
        <div className="flex justify-center gap-1.5 mb-4">
          {steps.map((_, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full transition-all duration-200"
              style={{ background: i === step ? "#5bb8ff" : "rgba(91,184,255,0.25)" }}
            />
          ))}
        </div>

        {/* 內容 */}
        <div className="text-center space-y-3 mb-5">
          <span className="text-3xl">{current.emoji}</span>
          <h3
            className="text-base tracking-widest text-[#e2c9a0]/85"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            {current.title}
          </h3>
          <p
            className="text-sm text-[#e2c9a0]/50 leading-relaxed"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            {current.body}
          </p>
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-3">
          <button
            onClick={dismiss}
            className="flex-1 py-2 rounded border border-[#e2c9a0]/10 font-mono-sys text-[10px] tracking-widest text-[#e2c9a0]/30 hover:text-[#e2c9a0]/55 transition-colors"
          >
            跳過
          </button>
          <button
            onClick={next}
            className="flex-1 py-2 rounded border border-[#5bb8ff]/40 font-mono-sys text-[10px] tracking-widest text-[#5bb8ff]/70 hover:bg-[#5bb8ff]/10 transition-colors"
          >
            {step < steps.length - 1 ? "下一步" : "開始"}
          </button>
        </div>
      </div>
    </>
  );
}
