"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// ── localStorage 鍵名 ─────────────────────────────────────────
const settingKey = (sessionId: string, key: string) => `pez_setting_${key}_${sessionId}`;

// ── 選項定義 ──────────────────────────────────────────────────
const FONT_SIZE_OPTIONS = [
  { value: "sm",  label: "小",  px: "13px" },
  { value: "md",  label: "中",  px: "15px" },
  { value: "lg",  label: "大",  px: "17px" },
  { value: "xl",  label: "特大", px: "20px" },
] as const;
type FontSizeValue = typeof FONT_SIZE_OPTIONS[number]["value"];

const TYPEWRITER_OPTIONS = [
  { value: "fast",   label: "快",  ms: 12  },
  { value: "normal", label: "正常", ms: 26  },
  { value: "slow",   label: "慢",  ms: 50  },
  { value: "off",    label: "關閉", ms: 0   },
] as const;
type TypewriterValue = typeof TYPEWRITER_OPTIONS[number]["value"];

// ── 套用字型大小 ──────────────────────────────────────────────
function applyFontSize(value: FontSizeValue) {
  const opt = FONT_SIZE_OPTIONS.find((o) => o.value === value);
  if (!opt) return;
  try {
    document.documentElement.style.setProperty("--game-font-size", opt.px);
    localStorage.setItem("pez_font_size", opt.px);
  } catch { /* ignore */ }
}

export default function SettingsPage() {
  const params    = useParams();
  const router    = useRouter();
  const sessionId = params.sessionId as string;

  const [fontSize,         setFontSize]         = useState<FontSizeValue>("md");
  const [showActionHints,  setShowActionHints]  = useState(true);
  const [typewriterSpeed,  setTypewriterSpeed]  = useState<TypewriterValue>("normal");
  const [saved,            setSaved]            = useState(false);
  const [bgmVolume,        setBgmVolume]        = useState(50);
  const [manualSaved,      setManualSaved]      = useState(false);

  // 載入既有設定
  useEffect(() => {
    try {
      const fs   = localStorage.getItem(settingKey(sessionId, "fontSize")) as FontSizeValue | null;
      const sah  = localStorage.getItem(settingKey(sessionId, "showActionHints"));
      const tws  = localStorage.getItem(settingKey(sessionId, "typewriterSpeed")) as TypewriterValue | null;

      if (fs)  setFontSize(fs);
      if (sah !== null) setShowActionHints(sah !== "false");
      if (tws) setTypewriterSpeed(tws);

      const bgm = localStorage.getItem("pez_audio_volume");
      if (bgm) setBgmVolume(Math.round(parseFloat(bgm) * 100));
    } catch { /* ignore */ }
  }, [sessionId]);

  function saveSettings() {
    try {
      localStorage.setItem(settingKey(sessionId, "fontSize"),        fontSize);
      localStorage.setItem(settingKey(sessionId, "showActionHints"), String(showActionHints));
      localStorage.setItem(settingKey(sessionId, "typewriterSpeed"), typewriterSpeed);

      // 即時套用字型大小
      applyFontSize(fontSize);

      // 打字機速度套用到全域常數
      const ms = TYPEWRITER_OPTIONS.find((o) => o.value === typewriterSpeed)?.ms ?? 26;
      localStorage.setItem("pez_typewriter_ms", String(ms));

      // BGM 音量
      localStorage.setItem("pez_audio_volume", String(bgmVolume / 100));
    } catch { /* ignore */ }

    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const OptionRow = ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div className="py-4 border-b border-[#e2c9a0]/06">
      <p
        className="text-xs text-[#e2c9a0]/45 mb-3 tracking-wide"
        style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
      >
        {label}
      </p>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto bg-[#0d1117]">

      {/* 標題列 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#e2c9a0]/6">
        <button
          onClick={() => router.back()}
          className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/60 tracking-widest transition-colors"
        >
          ← 返回
        </button>
        <p
          className="text-xs tracking-widest text-[#e2c9a0]/55"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        >
          設定
        </p>
        <div className="w-16" />
      </header>

      {/* 設定內容 */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-8">

        {/* 字體大小 */}
        <OptionRow label="文字大小">
          <div className="flex gap-2">
            {FONT_SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFontSize(opt.value)}
                className="flex-1 py-2.5 rounded border font-mono-sys text-[11px] tracking-widest transition-all duration-150"
                style={{
                  borderColor: fontSize === opt.value
                    ? "rgba(91,184,255,0.50)"
                    : "rgba(226,201,160,0.10)",
                  color:       fontSize === opt.value
                    ? "#5bb8ff"
                    : "rgba(226,201,160,0.35)",
                  background:  fontSize === opt.value
                    ? "rgba(91,184,255,0.08)"
                    : "transparent",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p
            className="font-mono-sys text-[9px] text-[#e2c9a0]/20 mt-2 tracking-widest"
          >
            目前：{FONT_SIZE_OPTIONS.find((o) => o.value === fontSize)?.px}
          </p>
        </OptionRow>

        {/* 行動建議開關 */}
        <OptionRow label="行動建議">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowActionHints(!showActionHints)}
              className="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
              style={{
                background: showActionHints
                  ? "rgba(91,184,255,0.35)"
                  : "rgba(226,201,160,0.08)",
              }}
            >
              <span
                className="absolute top-1 w-4 h-4 rounded-full transition-all duration-200"
                style={{
                  left:       showActionHints ? "calc(100% - 20px)" : "4px",
                  background: showActionHints ? "#5bb8ff" : "rgba(226,201,160,0.30)",
                }}
              />
            </button>
            <span
              className="text-xs"
              style={{
                fontFamily: "var(--font-noto-serif-tc), serif",
                color:      showActionHints ? "rgba(226,201,160,0.55)" : "rgba(226,201,160,0.25)",
              }}
            >
              {showActionHints ? "顯示" : "隱藏"}問話建議與場景動作提示
            </span>
          </div>
        </OptionRow>

        {/* 打字機速度 */}
        <OptionRow label="NPC 打字機速度">
          <div className="flex gap-2">
            {TYPEWRITER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTypewriterSpeed(opt.value)}
                className="flex-1 py-2.5 rounded border font-mono-sys text-[11px] tracking-widest transition-all duration-150"
                style={{
                  borderColor: typewriterSpeed === opt.value
                    ? "rgba(226,201,160,0.45)"
                    : "rgba(226,201,160,0.10)",
                  color:       typewriterSpeed === opt.value
                    ? "rgba(226,201,160,0.80)"
                    : "rgba(226,201,160,0.30)",
                  background:  typewriterSpeed === opt.value
                    ? "rgba(226,201,160,0.06)"
                    : "transparent",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="font-mono-sys text-[9px] text-[#e2c9a0]/20 mt-2 tracking-widest">
            {typewriterSpeed === "off" ? "文字即時顯示，無打字效果" : `${TYPEWRITER_OPTIONS.find((o) => o.value === typewriterSpeed)?.ms}ms / 字`}
          </p>
        </OptionRow>

        {/* BGM 音量（預留）*/}
        <OptionRow label="BGM 音量（預留）">
          <div className="flex items-center gap-3">
            <span className="font-mono-sys text-[9px] text-[#e2c9a0]/25 shrink-0">🔇</span>
            <input
              type="range"
              min={0}
              max={100}
              value={bgmVolume}
              onChange={(e) => setBgmVolume(Number(e.target.value))}
              className="flex-1 h-1 accent-[#5bb8ff] bg-[#e2c9a0]/10 rounded-full appearance-none cursor-pointer"
            />
            <span className="font-mono-sys text-[9px] text-[#e2c9a0]/25 shrink-0">🔊</span>
            <span className="font-mono-sys text-[9px] text-[#e2c9a0]/35 w-8 text-right">{bgmVolume}%</span>
          </div>
          <p className="font-mono-sys text-[9px] text-[#e2c9a0]/15 mt-2 tracking-widest">
            音效系統尚在準備中，調整將在音源加入後生效。
          </p>
        </OptionRow>

        {/* 手動存檔 */}
        <OptionRow label="手動存檔">
          <button
            onClick={() => {
              try {
                const snapshot = {
                  sessionId,
                  timestamp: Date.now(),
                  keys: {} as Record<string, string>,
                };
                for (let i = 0; i < localStorage.length; i++) {
                  const k = localStorage.key(i);
                  if (k && k.startsWith("pez_")) {
                    snapshot.keys[k] = localStorage.getItem(k) ?? "";
                  }
                }
                localStorage.setItem(`pez_save_${sessionId}`, JSON.stringify(snapshot));
                setManualSaved(true);
                setTimeout(() => setManualSaved(false), 2000);
              } catch { /* ignore */ }
            }}
            className="w-full py-2.5 rounded border font-mono-sys text-xs tracking-widest transition-all duration-200"
            style={{
              borderColor: manualSaved ? "rgba(74,222,128,0.40)" : "rgba(226,201,160,0.15)",
              color:       manualSaved ? "rgba(74,222,128,0.70)" : "rgba(226,201,160,0.45)",
              background:  manualSaved ? "rgba(74,222,128,0.05)" : "transparent",
            }}
          >
            {manualSaved ? "已存檔 ✓" : "存檔目前進度"}
          </button>
          <p className="font-mono-sys text-[9px] text-[#e2c9a0]/15 mt-2 tracking-widest">
            將目前的遊戲進度存儲到瀏覽器。
          </p>
        </OptionRow>

        {/* 儲存按鈕 */}
        <div className="pt-8 flex flex-col items-center gap-3">
          <button
            onClick={saveSettings}
            className="w-full max-w-xs py-3 rounded border font-mono-sys text-xs tracking-[0.3em] transition-all duration-200"
            style={{
              borderColor: saved ? "rgba(74,222,128,0.50)" : "rgba(226,201,160,0.25)",
              color:       saved ? "rgba(74,222,128,0.80)" : "rgba(226,201,160,0.60)",
              background:  saved ? "rgba(74,222,128,0.06)" : "transparent",
            }}
          >
            {saved ? "已儲存 ✓" : "儲存設定"}
          </button>
          <Link
            href={`/game/${sessionId}`}
            className="font-mono-sys text-[10px] text-[#e2c9a0]/20 hover:text-[#e2c9a0]/50 tracking-widest transition-colors"
          >
            回到遊戲
          </Link>
        </div>
      </div>
    </div>
  );
}
