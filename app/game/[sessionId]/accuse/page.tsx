"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SUSPECTS, MOTIVES, COMPATIBILITY } from "@/lib/case-config";
import type { KillerId, MotiveDirection } from "@/lib/case-config";

type Step = 1 | 2 | 3;

// ── 動機方向顏色 ──────────────────────────────────────────────
const MOTIVE_COLOR: Record<MotiveDirection, { border: string; bg: string; text: string; badge: string }> = {
  A: { border: "rgba(91,184,255,0.40)",  bg: "rgba(91,184,255,0.06)",  text: "#5bb8ff",  badge: "rgba(91,184,255,0.15)"  },
  B: { border: "rgba(255,56,100,0.40)",  bg: "rgba(255,56,100,0.06)",  text: "#ff3864",  badge: "rgba(255,56,100,0.15)"  },
  C: { border: "rgba(74,222,128,0.35)",  bg: "rgba(74,222,128,0.05)",  text: "#4ade80",  badge: "rgba(74,222,128,0.12)"  },
  D: { border: "rgba(192,132,252,0.35)", bg: "rgba(192,132,252,0.05)", text: "#c084fc",  badge: "rgba(192,132,252,0.12)" },
};

// ── 嫌疑人序號（顯示用）──────────────────────────────────────
const SUSPECT_KEYS = Object.keys(SUSPECTS) as KillerId[];

export default function AccusePage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;
  const router    = useRouter();

  const [step,         setStep]         = useState<Step>(1);
  const [chosenKiller, setChosenKiller] = useState<KillerId | null>(null);
  const [chosenMotive, setChosenMotive] = useState<MotiveDirection | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState("");

  const suspectList = Object.values(SUSPECTS);
  const motiveList  = Object.values(MOTIVES);

  async function handleSubmit() {
    if (!chosenKiller || !chosenMotive || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/game/accuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, accusedKillerId: chosenKiller, accusedMotive: chosenMotive }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.message ?? "提交失敗，請稍後再試。"); return; }
      localStorage.setItem(`pez_result_${sessionId}`, JSON.stringify(data));
      router.push(`/game/${sessionId}/result`);
    } catch {
      setSubmitError("網路連線失敗，請稍後再試。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto bg-[#0d1117]">

      {/* ── 標題列 ────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#e2c9a0]/6">
        <Link
          href={`/game/${sessionId}`}
          className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/60 tracking-widest transition-colors"
        >
          ← 返回
        </Link>
        <div className="text-center">
          <p
            className="text-xs tracking-widest text-[#e2c9a0]/55"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            提出指控
          </p>
          <p className="font-mono-sys text-[9px] text-[#5bb8ff]/30 tracking-widest mt-0.5">
            STEP {step} / 3
          </p>
        </div>
        <div className="w-16" />
      </header>

      {/* ── 步驟進度條 ─────────────────────────────────────── */}
      <div className="flex gap-1.5 px-4 pt-3 pb-1">
        {([1, 2, 3] as Step[]).map((s) => (
          <div
            key={s}
            className="flex-1 h-[2px] rounded-full transition-all duration-500"
            style={{
              background: s <= step
                ? "linear-gradient(90deg, #ff3864, #ff8c55)"
                : "rgba(226,201,160,0.08)",
            }}
          />
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
         步驟 1：選擇嫌疑人
         ══════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <p
              className="text-xs text-[#e2c9a0]/40 leading-relaxed"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              你認為誰是這起失蹤案的幕後黑手？
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {suspectList.map((s, idx) => {
              const num = String(SUSPECT_KEYS.indexOf(s.id) + 1).padStart(2, "0");
              return (
                <button
                  key={s.id}
                  onClick={() => { setChosenKiller(s.id); setChosenMotive(null); setStep(2); }}
                  className={`
                    relative text-left p-3.5 border rounded
                    transition-all duration-200 card-lift
                    animate-fade-in-up opacity-0
                  `}
                  style={{
                    animationDelay: `${idx * 40}ms`,
                    borderColor:    chosenKiller === s.id ? "#ff3864" : "rgba(226,201,160,0.10)",
                    background:     chosenKiller === s.id ? "rgba(255,56,100,0.07)" : "rgba(17,24,32,0.8)",
                    boxShadow:      chosenKiller === s.id ? "0 0 16px rgba(255,56,100,0.15)" : undefined,
                  }}
                >
                  {/* 序號 */}
                  <span
                    className="absolute top-2.5 right-2.5 font-mono-sys text-[9px] text-[#e2c9a0]/20 tracking-wider"
                  >
                    {num}
                  </span>

                  {/* 名稱 */}
                  <p
                    className="text-sm text-[#e2c9a0] tracking-wide mb-0.5 pr-6"
                    style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                  >
                    {s.name}
                  </p>

                  {/* 身份標籤 */}
                  <span
                    className="inline-block font-mono-sys text-[9px] px-1.5 py-0.5 rounded mb-1.5"
                    style={{
                      color:       "rgba(226,201,160,0.45)",
                      background:  "rgba(226,201,160,0.07)",
                      border:      "1px solid rgba(226,201,160,0.10)",
                    }}
                  >
                    {s.role}
                  </span>

                  {/* 描述 */}
                  <p
                    className="text-[10px] text-[#e2c9a0]/35 leading-relaxed line-clamp-2"
                    style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                  >
                    {s.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
         步驟 2：選擇動機方向
         ══════════════════════════════════════════════════════ */}
      {step === 2 && chosenKiller && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <button
            onClick={() => setStep(1)}
            className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/60 tracking-widest transition-colors mb-4"
          >
            ← 重新選擇嫌疑人
          </button>

          <div className="flex items-center gap-2 mb-5">
            <span className="text-[10px] text-[#e2c9a0]/30 tracking-wide" style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}>
              嫌疑人：
            </span>
            <span
              className="text-sm text-[#ff3864] tracking-wider"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              {SUSPECTS[chosenKiller].name}
            </span>
            <span className="text-[10px] text-[#e2c9a0]/25 tracking-wide" style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}>
              的行兇動機是？
            </span>
          </div>

          <div className="space-y-2.5">
            {motiveList.map((m, idx) => {
              const pal = MOTIVE_COLOR[m.id];
              return (
                <button
                  key={m.id}
                  onClick={() => { setChosenMotive(m.id); setStep(3); }}
                  className={`
                    w-full text-left p-4 rounded
                    border-l-[3px] border-t border-r border-b
                    transition-all duration-200 card-lift
                    animate-fade-in-up opacity-0
                  `}
                  style={{
                    animationDelay:  `${idx * 60}ms`,
                    borderLeftColor: pal.border,
                    borderTopColor:    "rgba(226,201,160,0.07)",
                    borderRightColor:  "rgba(226,201,160,0.07)",
                    borderBottomColor: "rgba(226,201,160,0.07)",
                    background:        chosenMotive === m.id ? pal.bg : "rgba(17,24,32,0.7)",
                  }}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span
                      className="font-mono-sys text-[11px] w-5 h-5 flex items-center justify-center rounded-sm border font-bold"
                      style={{ color: pal.text, borderColor: pal.badge, background: pal.badge }}
                    >
                      {m.id}
                    </span>
                    <p
                      className="text-sm tracking-wide"
                      style={{ fontFamily: "var(--font-noto-serif-tc), serif", color: "#e2c9a0" }}
                    >
                      {m.name}
                    </p>
                  </div>
                  <p
                    className="text-xs text-[#e2c9a0]/38 leading-relaxed pl-7"
                    style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                  >
                    {m.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
         步驟 3：確認指控
         ══════════════════════════════════════════════════════ */}
      {step === 3 && chosenKiller && chosenMotive && (
        <div className="flex-1 flex flex-col px-4 py-4">
          <button
            onClick={() => setStep(2)}
            className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/60 tracking-widest transition-colors mb-6 self-start"
          >
            ← 修改動機
          </button>

          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            {/* 指控摘要卡 */}
            <div
              className="corner-bracket border border-[#e2c9a0]/10 rounded p-6 w-full max-w-xs space-y-5 animate-fade-in"
              style={{ background: "rgba(17,24,32,0.9)" }}
            >
              <p className="font-mono-sys text-[10px] text-[#5bb8ff]/35 tracking-[0.4em] uppercase text-center">
                ACCUSATION SUMMARY
              </p>

              {/* 兇手 */}
              <div className="text-center">
                <p className="font-mono-sys text-[10px] text-[#e2c9a0]/25 mb-1 tracking-widest">兇手</p>
                <p
                  className="text-xl text-[#e2c9a0] tracking-wider glow-text-accent"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  {SUSPECTS[chosenKiller].name}
                </p>
                <p className="font-mono-sys text-[10px] text-[#e2c9a0]/30 mt-0.5">
                  {SUSPECTS[chosenKiller].role}
                </p>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-[#e2c9a0]/10 to-transparent" />

              {/* 動機 */}
              <div className="text-center">
                <p className="font-mono-sys text-[10px] text-[#e2c9a0]/25 mb-2 tracking-widest">動機方向</p>
                <div className="flex items-center justify-center gap-2">
                  <span
                    className="font-mono-sys text-[11px] w-6 h-6 flex items-center justify-center rounded border font-bold"
                    style={{
                      color:        MOTIVE_COLOR[chosenMotive].text,
                      borderColor:  MOTIVE_COLOR[chosenMotive].badge,
                      background:   MOTIVE_COLOR[chosenMotive].badge,
                    }}
                  >
                    {chosenMotive}
                  </span>
                  <p
                    className="text-sm text-[#e2c9a0]"
                    style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                  >
                    {MOTIVES[chosenMotive].name}
                  </p>
                </div>
              </div>
            </div>

            {/* 警告文字 */}
            <p
              className="text-xs text-[#e2c9a0]/28 leading-relaxed max-w-xs text-center animate-fade-in delay-300 opacity-0"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              指控一旦提出，遊戲本局隨即結束。<br />
              確定要這樣指控嗎？
            </p>

            {submitError && (
              <p className="font-mono-sys text-[11px] text-[#ff3864]/70 tracking-wide animate-fade-in">
                {submitError}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full max-w-xs py-3.5 border border-[#ff3864]/55 text-[#ff3864] text-sm tracking-[0.2em] hover:bg-[#ff3864]/10 hover:border-[#ff3864]/80 active:bg-[#ff3864]/20 transition-all duration-300 disabled:opacity-40 rounded glow-box-accent animate-fade-in delay-500 opacity-0"
            >
              {submitting ? (
                <span className="font-mono-sys text-xs">SUBMITTING...</span>
              ) : (
                "確認指控"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
