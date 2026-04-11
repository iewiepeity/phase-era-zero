"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  SUSPECTS,
  MOTIVES,
  SUB_MOTIVES,
  getSubMotivesForDirection,
} from "@/lib/case-config";
import { MOTIVE_COLORS, STORAGE_KEYS } from "@/lib/constants";
import { SuspectCard } from "@/components/game/SuspectCard";
import type { KillerId, MotiveDirection, SubMotiveId } from "@/lib/case-config";

type Step = 1 | 2 | 3 | 4;

const SUSPECT_KEYS = Object.keys(SUSPECTS) as KillerId[];

export default function AccusePage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;
  const router    = useRouter();

  const [step,            setStep]            = useState<Step>(1);
  const [chosenKiller,    setChosenKiller]    = useState<KillerId | null>(null);
  const [chosenMotive,    setChosenMotive]    = useState<MotiveDirection | null>(null);
  const [chosenSubMotive, setChosenSubMotive] = useState<SubMotiveId | null>(null);
  const [submitting,      setSubmitting]      = useState(false);
  const [submitError,     setSubmitError]     = useState("");

  const suspectList  = Object.values(SUSPECTS);
  const motiveList   = Object.values(MOTIVES);
  const subMotives   = chosenMotive ? getSubMotivesForDirection(chosenMotive) : [];

  async function handleSubmit() {
    if (!chosenKiller || !chosenMotive || !chosenSubMotive || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/game/accuse", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          sessionId,
          accusedKillerId:  chosenKiller,
          accusedMotive:    chosenMotive,
          accusedSubMotive: chosenSubMotive,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.message ?? "提交失敗，請稍後再試。"); return; }
      localStorage.setItem(STORAGE_KEYS.RESULT(sessionId), JSON.stringify(data));
      router.push(`/game/${sessionId}/result`);
    } catch {
      setSubmitError("網路連線失敗，請稍後再試。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto bg-[#0d1117]">

      {/* ── 標題列 ─────────────────────────────────────── */}
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
            STEP {step} / 4
          </p>
        </div>
        <div className="w-16" />
      </header>

      {/* ── 步驟進度條 ──────────────────────────────────── */}
      <div className="flex gap-1.5 px-4 pt-3 pb-1">
        {([1, 2, 3, 4] as Step[]).map((s) => (
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

      {/* ══ 步驟 1：選擇嫌疑人 ══════════════════════════ */}
      {step === 1 && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p
            className="text-xs text-[#e2c9a0]/40 leading-relaxed mb-4"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            你認為誰是這起失蹤案的幕後黑手？
          </p>

          <div className="grid grid-cols-2 gap-2">
            {suspectList.map((s, idx) => (
              <SuspectCard
                key={s.id}
                suspect={s}
                number={SUSPECT_KEYS.indexOf(s.id) + 1}
                selected={chosenKiller === s.id}
                animIndex={idx}
                onClick={(id) => {
                  setChosenKiller(id);
                  setChosenMotive(null);
                  setChosenSubMotive(null);
                  setStep(2);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ══ 步驟 2：選擇動機方向 ══════════════════════ */}
      {step === 2 && chosenKiller && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <button
            onClick={() => setStep(1)}
            className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/60 tracking-widest transition-colors mb-4"
          >
            ← 重新選擇嫌疑人
          </button>

          <div className="flex items-center gap-2 mb-5">
            <span
              className="text-[10px] text-[#e2c9a0]/30 tracking-wide"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              嫌疑人：
            </span>
            <span
              className="text-sm text-[#ff3864] tracking-wider"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              {SUSPECTS[chosenKiller].name}
            </span>
            <span
              className="text-[10px] text-[#e2c9a0]/25 tracking-wide"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              的行兇動機方向是？
            </span>
          </div>

          <div className="space-y-2.5">
            {motiveList.map((m, idx) => {
              const pal = MOTIVE_COLORS[m.id];
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setChosenMotive(m.id);
                    setChosenSubMotive(null);
                    setStep(3);
                  }}
                  className="w-full text-left p-4 rounded border-l-[3px] border-t border-r border-b transition-all duration-200 card-lift animate-fade-in-up opacity-0"
                  style={{
                    animationDelay:    `${idx * 60}ms`,
                    borderLeftColor:   pal.border,
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
                      className="text-sm tracking-wide text-[#e2c9a0]"
                      style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
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

      {/* ══ 步驟 3：選擇子動機 ══════════════════════════ */}
      {step === 3 && chosenKiller && chosenMotive && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <button
            onClick={() => setStep(2)}
            className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/60 tracking-widest transition-colors mb-4"
          >
            ← 重新選擇動機方向
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] text-[#e2c9a0]/30 tracking-wide"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              動機方向：
            </span>
            <span
              className="font-mono-sys text-[11px] w-5 h-5 flex items-center justify-center rounded-sm border font-bold"
              style={{
                color:       MOTIVE_COLORS[chosenMotive].text,
                borderColor: MOTIVE_COLORS[chosenMotive].badge,
                background:  MOTIVE_COLORS[chosenMotive].badge,
              }}
            >
              {chosenMotive}
            </span>
            <span
              className="text-sm text-[#e2c9a0]/70 tracking-wide"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              {MOTIVES[chosenMotive].name}
            </span>
          </div>

          <p
            className="text-xs text-[#e2c9a0]/35 mb-5"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            具體動機是哪一種？
          </p>

          <div className="space-y-3">
            {subMotives.map((sub, idx) => (
              <button
                key={sub.id}
                onClick={() => { setChosenSubMotive(sub.id); setStep(4); }}
                className="w-full text-left p-4 rounded border border-[#e2c9a0]/8 transition-all duration-200 card-lift animate-fade-in-up opacity-0"
                style={{
                  animationDelay: `${idx * 80}ms`,
                  background: chosenSubMotive === sub.id
                    ? MOTIVE_COLORS[chosenMotive].bg
                    : "rgba(17,24,32,0.7)",
                  borderColor: chosenSubMotive === sub.id
                    ? MOTIVE_COLORS[chosenMotive].border
                    : "rgba(226,201,160,0.08)",
                }}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span
                    className="font-mono-sys text-[10px] px-1.5 py-0.5 rounded border"
                    style={{
                      color:       MOTIVE_COLORS[chosenMotive].text,
                      borderColor: MOTIVE_COLORS[chosenMotive].badge,
                      background:  "rgba(0,0,0,0.3)",
                    }}
                  >
                    {sub.id}
                  </span>
                  <p
                    className="text-sm tracking-wide text-[#e2c9a0]"
                    style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                  >
                    {sub.name}
                  </p>
                </div>
                <p
                  className="text-xs text-[#e2c9a0]/38 leading-relaxed pl-8"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  {sub.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ══ 步驟 4：確認指控 ══════════════════════════ */}
      {step === 4 && chosenKiller && chosenMotive && chosenSubMotive && (
        <div className="flex-1 flex flex-col px-4 py-4">
          <button
            onClick={() => setStep(3)}
            className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/60 tracking-widest transition-colors mb-6 self-start"
          >
            ← 修改子動機
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

              {/* 動機方向 */}
              <div className="text-center">
                <p className="font-mono-sys text-[10px] text-[#e2c9a0]/25 mb-2 tracking-widest">動機方向</p>
                <div className="flex items-center justify-center gap-2">
                  <span
                    className="font-mono-sys text-[11px] w-6 h-6 flex items-center justify-center rounded border font-bold"
                    style={{
                      color:       MOTIVE_COLORS[chosenMotive].text,
                      borderColor: MOTIVE_COLORS[chosenMotive].badge,
                      background:  MOTIVE_COLORS[chosenMotive].badge,
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

              <div className="h-px bg-gradient-to-r from-transparent via-[#e2c9a0]/10 to-transparent" />

              {/* 子動機 */}
              <div className="text-center">
                <p className="font-mono-sys text-[10px] text-[#e2c9a0]/25 mb-2 tracking-widest">具體動機</p>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span
                    className="font-mono-sys text-[10px] px-1.5 py-0.5 rounded border"
                    style={{
                      color:       MOTIVE_COLORS[chosenMotive].text,
                      borderColor: MOTIVE_COLORS[chosenMotive].badge,
                      background:  "rgba(0,0,0,0.3)",
                    }}
                  >
                    {chosenSubMotive}
                  </span>
                  <p
                    className="text-sm text-[#e2c9a0]"
                    style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                  >
                    {SUB_MOTIVES[chosenSubMotive].name}
                  </p>
                </div>
                <p
                  className="text-[11px] text-[#e2c9a0]/30 leading-relaxed"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  {SUB_MOTIVES[chosenSubMotive].description}
                </p>
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
