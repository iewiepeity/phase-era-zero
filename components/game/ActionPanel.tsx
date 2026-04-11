"use client";

import { useState, useEffect } from "react";
import type { ActionOption } from "@/lib/content/action-options";

// ── Constants ──────────────────────────────────────────────────

const STORAGE_KEY = "pez_action_panel_open";

const TYPE_ICON: Record<ActionOption["type"], string> = {
  explore:  "◈",
  chat:     "◎",
  navigate: "→",
  leave:    "←",
};

// ── Props ──────────────────────────────────────────────────────

interface ActionPanelProps {
  options:    ActionOption[];
  accentColor?: string;
  onExplore?:  (targetItemId: string) => void;
  onChat?:     (chatText: string) => void;
  onNavigate?: (npcId: string) => void;
  onLeave?:    () => void;
  label?:      string;
}

// ── Component ──────────────────────────────────────────────────

export function ActionPanel({
  options,
  accentColor = "#5bb8ff",
  onExplore,
  onChat,
  onNavigate,
  onLeave,
  label = "行動建議",
}: ActionPanelProps) {
  const [open, setOpen] = useState(true);

  // Restore collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) setOpen(saved === "true");
  }, []);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  function handleOption(opt: ActionOption) {
    switch (opt.type) {
      case "explore":
        if (opt.targetItemId && onExplore) onExplore(opt.targetItemId);
        break;
      case "chat":
        if (opt.chatText && onChat) onChat(opt.chatText);
        break;
      case "navigate":
        if (opt.npcId && onNavigate) onNavigate(opt.npcId);
        break;
      case "leave":
        if (onLeave) onLeave();
        break;
    }
  }

  if (options.length === 0) return null;

  return (
    <div
      className="rounded-lg border overflow-hidden transition-all duration-300"
      style={{
        borderColor: `${accentColor}20`,
        background:  "rgba(13,17,23,0.85)",
      }}
    >
      {/* Header / toggle */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-2">
          <span
            className="font-mono-sys text-[9px] leading-none"
            style={{ color: `${accentColor}90` }}
          >
            ◆
          </span>
          {open && (
            <span
              className="font-mono-sys text-[9px] tracking-[0.3em] uppercase"
              style={{ color: `${accentColor}70` }}
            >
              {label}
            </span>
          )}
        </div>
        <span
          className="font-mono-sys text-[9px] transition-transform duration-200"
          style={{
            color:     `${accentColor}40`,
            transform: open ? "rotate(0deg)" : "rotate(180deg)",
          }}
        >
          ▲
        </span>
      </button>

      {/* Options */}
      {open && (
        <div
          className="px-3 pb-3 flex flex-wrap gap-2"
          style={{ borderTop: `1px solid ${accentColor}10` }}
        >
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleOption(opt)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                borderColor: `${accentColor}22`,
                color:       `${accentColor}80`,
                background:  `${accentColor}06`,
                fontFamily:  "var(--font-noto-serif-tc), serif",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${accentColor}45`;
                (e.currentTarget as HTMLButtonElement).style.color       = `${accentColor}CC`;
                (e.currentTarget as HTMLButtonElement).style.background  = `${accentColor}12`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${accentColor}22`;
                (e.currentTarget as HTMLButtonElement).style.color       = `${accentColor}80`;
                (e.currentTarget as HTMLButtonElement).style.background  = `${accentColor}06`;
              }}
            >
              <span className="font-mono-sys text-[9px] opacity-60">
                {TYPE_ICON[opt.type]}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
