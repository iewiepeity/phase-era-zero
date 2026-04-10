"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SUSPECTS, MOTIVES, COMPATIBILITY } from "@/lib/case-config";
import type { KillerId, MotiveDirection } from "@/lib/case-config";

type Step = 1 | 2 | 3;

export default function AccusePage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;
  const router    = useRouter();

  const [step,              setStep]              = useState<Step>(1);
  const [chosenKiller,      setChosenKiller]      = useState<KillerId | null>(null);
  const [chosenMotive,      setChosenMotive]      = useState<MotiveDirection | null>(null);
  const [submitting,        setSubmitting]        = useState(false);
  const [submitError,       setSubmitError]       = useState("");

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
        body: JSON.stringify({
          sessionId,
          accusedKillerId:  chosenKiller,
          accusedMotive:    chosenMotive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.message ?? "提交失敗，請稍後再試。");
        return;
      }
      // 存結果到 localStorage 供結局頁讀取
      localStorage.setItem(`pez_result_${sessionId}`, JSON.stringify(data));
      router.push(`/game/${sessionId}/result`);
    } catch {
      setSubmitError("網路連線失敗，請稍後再試。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto">
      {/* 標題列 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#c9d6df]/10">
        <Link
          href={`/game/${sessionId}`}
          className="text-xs text-[#c9d6df]/40 hover:text-[#c9d6df]/70 transition-colors tracking-wider"
        >
          ← 返回
        </Link>
        <div className="text-center">
          <p
            className="text-sm tracking-widest"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            提出指控
          </p>
          <p className="text-[10px] text-[#c9d6df]/25 tracking-wide">步驟 {step} / 3</p>
        </div>
        <div className="w-12" />
      </header>

      {/* 步驟進度條 */}
      <div className="flex gap-1 px-4 pt-3 pb-1">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-0.5 rounded-full transition-colors duration-500 ${
              s <= step ? "bg-[#ff2e63]" : "bg-[#c9d6df]/10"
            }`}
          />
        ))}
      </div>

      {/* ── 步驟 1：選擇嫌疑人 ────────────────────────────────── */}
      {step === 1 && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p
            className="text-xs text-[#c9d6df]/40 mb-4 leading-relaxed"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            你認為誰是這起失蹤案的幕後黑手？
          </p>
          <div className="grid grid-cols-2 gap-2">
            {suspectList.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setChosenKiller(s.id);
                  setChosenMotive(null);
                  setStep(2);
                }}
                className={`text-left p-3 border rounded transition-all ${
                  chosenKiller === s.id
                    ? "border-[#ff2e63]/60 bg-[#ff2e63]/8"
                    : "border-[#c9d6df]/12 hover:border-[#c9d6df]/30"
                }`}
              >
                <p
                  className="text-sm text-[#c9d6df] tracking-wide mb-0.5"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  {s.name}
                </p>
                <p className="text-[10px] text-[#c9d6df]/35 tracking-wide">{s.role}</p>
                <p
                  className="text-[10px] text-[#c9d6df]/40 leading-relaxed mt-1.5 line-clamp-2"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  {s.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 步驟 2：選擇動機方向 ──────────────────────────────── */}
      {step === 2 && chosenKiller && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => setStep(1)}
              className="text-[10px] text-[#c9d6df]/30 hover:text-[#c9d6df]/60 transition-colors tracking-wide"
            >
              ← 重新選擇
            </button>
          </div>
          <p
            className="text-xs text-[#c9d6df]/40 mb-1 mt-2"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            嫌疑人：
            <span className="text-[#c9d6df]/70 ml-1">{SUSPECTS[chosenKiller].name}</span>
          </p>
          <p
            className="text-xs text-[#c9d6df]/35 mb-5 leading-relaxed"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            這個人的行兇動機是什麼？
          </p>
          <div className="space-y-2">
            {motiveList.map((m) => {
              const compatible = COMPATIBILITY[chosenKiller][m.id];
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setChosenMotive(m.id);
                    setStep(3);
                  }}
                  className={`w-full text-left p-4 border rounded transition-all ${
                    compatible
                      ? "border-[#c9d6df]/18 hover:border-[#c9d6df]/40"
                      : "border-[#c9d6df]/8 opacity-50"
                  } ${chosenMotive === m.id ? "border-[#ff2e63]/60 bg-[#ff2e63]/8" : ""}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-[#ff2e63]/60 border border-[#ff2e63]/30 w-5 h-5 flex items-center justify-center rounded-sm font-mono">
                      {m.id}
                    </span>
                    <p
                      className="text-sm text-[#c9d6df] tracking-wide"
                      style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                    >
                      {m.name}
                    </p>
                  </div>
                  <p
                    className="text-xs text-[#c9d6df]/40 leading-relaxed"
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

      {/* ── 步驟 3：確認指控 ──────────────────────────────────── */}
      {step === 3 && chosenKiller && chosenMotive && (
        <div className="flex-1 flex flex-col px-4 py-4">
          <button
            onClick={() => setStep(2)}
            className="text-[10px] text-[#c9d6df]/30 hover:text-[#c9d6df]/60 transition-colors tracking-wide mb-6 self-start"
          >
            ← 修改動機
          </button>

          {/* 指控摘要 */}
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
            <div className="border border-[#c9d6df]/10 rounded p-6 w-full max-w-xs space-y-4">
              <p className="text-[10px] text-[#c9d6df]/25 tracking-[0.3em] uppercase">指控摘要</p>

              <div>
                <p className="text-[10px] text-[#c9d6df]/30 mb-1 tracking-wide">兇手</p>
                <p
                  className="text-lg text-[#c9d6df] tracking-wider"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  {SUSPECTS[chosenKiller].name}
                </p>
                <p className="text-[10px] text-[#c9d6df]/35">{SUSPECTS[chosenKiller].role}</p>
              </div>

              <div className="border-t border-[#c9d6df]/10 pt-4">
                <p className="text-[10px] text-[#c9d6df]/30 mb-1 tracking-wide">動機方向</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[10px] text-[#ff2e63]/70 border border-[#ff2e63]/30 w-5 h-5 flex items-center justify-center rounded-sm font-mono">
                    {chosenMotive}
                  </span>
                  <p
                    className="text-sm text-[#c9d6df]"
                    style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                  >
                    {MOTIVES[chosenMotive].name}
                  </p>
                </div>
              </div>
            </div>

            <p
              className="text-xs text-[#c9d6df]/30 leading-relaxed max-w-xs"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              指控一旦提出，遊戲本局隨即結束。<br />
              確定要這樣指控嗎？
            </p>

            {submitError && (
              <p className="text-[11px] text-[#ff2e63]/70 tracking-wide">{submitError}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full max-w-xs py-3 border border-[#ff2e63]/60 text-[#ff2e63] text-sm tracking-[0.2em] hover:bg-[#ff2e63]/10 active:bg-[#ff2e63]/20 transition-colors disabled:opacity-40 rounded"
            >
              {submitting ? "提交中…" : "確認指控"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
