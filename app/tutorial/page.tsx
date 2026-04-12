"use client";

import { useState } from "react";
import Link from "next/link";

interface TutorialStep {
  id:       number;
  title:    string;
  subtitle: string;
  body:     string;
  preview:  React.ReactNode;
}

function ScenePreview() {
  return (
    <div className="rounded-lg border border-[#f59e0b]/20 bg-[#0d1117]/90 p-4 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono-sys text-[9px] text-[#f59e0b]/40 tracking-[0.4em]">SCENE</span>
        <span className="flex-1 h-px bg-[#f59e0b]/10" />
      </div>
      {["🍜  陳姐麵館", "🏚  案發現場", "🌉  霧港碼頭"].map((name) => (
        <div
          key={name}
          className="flex items-center gap-3 px-3 py-2 rounded border border-[#e2c9a0]/08 bg-[#e2c9a0]/02 text-sm text-[#e2c9a0]/50"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        >
          {name}
          <span className="ml-auto font-mono-sys text-[9px] text-[#e2c9a0]/20">進入 →</span>
        </div>
      ))}
      <p className="font-mono-sys text-[8px] text-[#e2c9a0]/15 text-right pt-1">
        選擇場景消耗 1 AP
      </p>
    </div>
  );
}

function ChatPreview() {
  return (
    <div className="rounded-lg border border-[#5bb8ff]/20 bg-[#0d1117]/90 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
        <span className="font-mono-sys text-[9px] text-[#f59e0b]/70">陳姐</span>
        <span className="font-mono-sys text-[8px] text-[#e2c9a0]/20 ml-auto">信任度 42</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-end">
          <div className="max-w-[80%] px-3 py-1.5 rounded text-xs bg-[#e2c9a0]/05 border border-[#e2c9a0]/10 text-[#e2c9a0]/60"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}>
            那個失蹤的人你認識嗎？
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[80%] px-3 py-1.5 rounded text-xs bg-[#5bb8ff]/05 border border-[#5bb8ff]/18 text-[#e2c9a0]/65"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}>
            認識。常來吃麵。不過……上個月之後就沒見過了。
          </div>
        </div>
      </div>
      <div className="flex gap-1 flex-wrap pt-1">
        {["繼續追問", "換個話題", "感謝離開"].map((opt) => (
          <span key={opt} className="font-mono-sys text-[8px] px-2 py-1 rounded-sm border border-[#5bb8ff]/15 text-[#5bb8ff]/40">
            {opt}
          </span>
        ))}
      </div>
    </div>
  );
}

function CluePreview() {
  return (
    <div className="rounded-lg border border-[#ff3864]/20 bg-[#0d1117]/90 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono-sys text-[9px] text-[#ff3864]/40 tracking-[0.4em]">CLUES</span>
        <span className="flex-1 h-px bg-[#ff3864]/10" />
        <span className="font-mono-sys text-[9px] text-[#ff3864]/40">3 條</span>
      </div>
      {[
        { icon: "📄", name: "醫療報告", src: "林知夏" },
        { icon: "🗝️", name: "倉庫鑰匙", src: "案發現場" },
        { icon: "📷", name: "撕破的照片", src: "韓卓" },
      ].map((c) => (
        <div key={c.name} className="flex items-center gap-3 px-3 py-2 rounded border border-[#e2c9a0]/06 bg-[#e2c9a0]/01">
          <span className="text-base">{c.icon}</span>
          <div className="flex-1">
            <p className="text-xs text-[#e2c9a0]/65" style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}>{c.name}</p>
            <p className="font-mono-sys text-[8px] text-[#e2c9a0]/20">{c.src}</p>
          </div>
          <span className="font-mono-sys text-[8px] px-1.5 py-0.5 rounded border border-[#f59e0b]/20 text-[#f59e0b]/50">道具</span>
        </div>
      ))}
    </div>
  );
}

function AccusePreview() {
  return (
    <div className="rounded-lg border border-[#ff3864]/30 bg-[#0d1117]/90 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono-sys text-[9px] text-[#ff3864]/50 tracking-[0.4em]">指控</span>
        <span className="flex-1 h-px bg-[#ff3864]/12" />
      </div>
      {["韓卓", "余霜", "林知夏"].map((name, i) => (
        <div
          key={name}
          className={`flex items-center gap-3 px-3 py-2.5 rounded border transition-all ${
            i === 0
              ? "border-[#ff3864]/40 bg-[#ff3864]/06"
              : "border-[#e2c9a0]/08 bg-[#e2c9a0]/01"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${i === 0 ? "bg-[#ff3864]" : "bg-[#e2c9a0]/20"}`}
          />
          <p
            className={`text-sm ${i === 0 ? "text-[#e2c9a0]/85" : "text-[#e2c9a0]/35"}`}
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            {name}
          </p>
          {i === 0 && (
            <span className="ml-auto font-mono-sys text-[8px] text-[#ff3864]/60 border border-[#ff3864]/30 px-1.5 py-0.5 rounded">
              已選擇
            </span>
          )}
        </div>
      ))}
      <button className="w-full mt-1 py-2.5 rounded border border-[#ff3864]/50 text-[#ff3864]/70 font-mono-sys text-xs tracking-widest hover:bg-[#ff3864]/10 transition-colors">
        確認指控
      </button>
    </div>
  );
}

const STEPS: TutorialStep[] = [
  {
    id:       1,
    title:    "歡迎來到賽德里斯",
    subtitle: "Phase Extinction 02",
    body:     "這是一個存在於相變技術高度發展的近未來都市。有人失蹤，有人說謊，你是唯一在追真相的人。\n\n你有有限的行動點數（AP）。用它探索、對話、蒐集線索。當你確信找到凶手時，做出指控。",
    preview:  (
      <div className="rounded-lg border border-[#ff3864]/20 bg-[#0d1117]/90 p-5 text-center">
        <h2
          className="text-3xl tracking-widest text-[#e2c9a0]/85 mb-2"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif", letterSpacing: "0.2em" }}
        >
          相變世紀
        </h2>
        <p className="font-mono-sys text-sm tracking-[0.4em] text-[#ff3864]/70 mb-4">ZERO</p>
        <div className="flex justify-center gap-2 flex-wrap">
          {["偵探", "謎案", "指控", "真相"].map((tag) => (
            <span key={tag} className="font-mono-sys text-[9px] px-2 py-1 border border-[#e2c9a0]/10 text-[#e2c9a0]/30 rounded-sm">
              {tag}
            </span>
          ))}
        </div>
        <p className="font-mono-sys text-[10px] text-[#e2c9a0]/18 mt-5 tracking-[0.3em]">
          CASE NO. PEO2-0114
        </p>
      </div>
    ),
  },
  {
    id:       2,
    title:    "場景探索",
    subtitle: "如何移動與尋找物件",
    body:     "從「地點選擇」畫面選擇一個場景進入。每次進入消耗 1 AP。\n\n在場景裡，你能看到人物、物品、環境線索。點擊它們可以觀察、拾取，或觸發對話。已探索的物件會標記 ✓。",
    preview:  <ScenePreview />,
  },
  {
    id:       3,
    title:    "對話系統",
    subtitle: "如何與 NPC 交流、建立信任",
    body:     "和 NPC 說話需要技巧。選擇回應選項，累積信任度。\n\n信任度越高，NPC 越願意透露關鍵資訊。「感謝離開」通常能快速提升信任，但你得在適當時機說。每次對話消耗 1 AP。",
    preview:  <ChatPreview />,
  },
  {
    id:       4,
    title:    "線索與道具",
    subtitle: "查看線索、嘗試道具組合",
    body:     "蒐集到的線索和道具儲存在「線索」和「道具欄」。\n\n嘗試把兩件道具組合在一起——有些組合會產生新的發現。點擊道具後按「使用」進入組合模式，再選第二件道具。",
    preview:  <CluePreview />,
  },
  {
    id:       5,
    title:    "最終指控",
    subtitle: "如何做出你的判斷",
    body:     "當你蒐集了足夠的線索，前往「指控」頁面。選出你認為最有可能是凶手的人，確認指控。\n\n錯誤的指控會有代價。準備好了再出手。",
    preview:  <AccusePreview />,
  },
];

export default function TutorialPage() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117]">
      <div className="fixed inset-0 bg-grid-static opacity-25 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex-1 flex flex-col max-w-xl mx-auto w-full px-5 pt-10 pb-8">

        {/* 頂部導覽 */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/55 tracking-widest transition-colors"
          >
            ← 首頁
          </Link>
          <p className="font-mono-sys text-[9px] text-[#5bb8ff]/25 tracking-widest">TUTORIAL</p>
        </div>

        {/* 進度指示器 */}
        <div className="flex items-center gap-1.5 mb-8">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStep(i)}
              className="transition-all duration-300"
              aria-label={`第 ${i + 1} 步`}
            >
              <span
                className="block rounded-full"
                style={{
                  width:      i === step ? "24px" : "6px",
                  height:     "6px",
                  background: i === step
                    ? "#5bb8ff"
                    : i < step
                    ? "rgba(91,184,255,0.35)"
                    : "rgba(226,201,160,0.12)",
                  transition: "all 0.3s",
                }}
              />
            </button>
          ))}
          <span className="font-mono-sys text-[9px] text-[#e2c9a0]/20 ml-auto tracking-widest">
            {step + 1} / {STEPS.length}
          </span>
        </div>

        {/* 步驟標題 */}
        <div className="mb-6">
          <p className="font-mono-sys text-[9px] text-[#5bb8ff]/40 tracking-[0.4em] uppercase mb-1">
            {current.subtitle}
          </p>
          <h1
            className="text-xl tracking-widest text-[#e2c9a0]/85"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            {current.title}
          </h1>
        </div>

        {/* 預覽 UI */}
        <div className="mb-6 transition-all duration-500">
          {current.preview}
        </div>

        {/* 說明文字 */}
        <p
          className="text-sm text-[#e2c9a0]/55 leading-loose flex-1"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif", whiteSpace: "pre-line" }}
        >
          {current.body}
        </p>

        {/* 操作按鈕 */}
        <div className="mt-8 space-y-3">
          {isLast ? (
            <Link
              href="/game"
              className="block w-full py-3.5 text-center rounded border border-[#ff3864]/55 text-[#ff3864]/80 font-mono-sys text-xs tracking-widest hover:bg-[#ff3864]/10 hover:border-[#ff3864]/80 transition-all"
            >
              開始遊戲 →
            </Link>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="w-full py-3.5 rounded border border-[#5bb8ff]/35 text-[#5bb8ff]/70 font-mono-sys text-xs tracking-widest hover:bg-[#5bb8ff]/08 hover:border-[#5bb8ff]/60 transition-all"
            >
              下一步 →
            </button>
          )}

          {!isFirst && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="w-full py-2.5 rounded border border-[#e2c9a0]/08 text-[#e2c9a0]/25 font-mono-sys text-[10px] tracking-widest hover:border-[#e2c9a0]/18 hover:text-[#e2c9a0]/45 transition-all"
            >
              ← 上一步
            </button>
          )}

          {!isLast && (
            <Link
              href="/game"
              className="block text-center font-mono-sys text-[10px] text-[#e2c9a0]/18 hover:text-[#e2c9a0]/40 tracking-widest transition-colors"
            >
              跳過教學，直接開始
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}
