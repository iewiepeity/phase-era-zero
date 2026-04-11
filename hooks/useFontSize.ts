"use client";

import { useState, useEffect, useCallback } from "react";

// ── 字體大小定義 ───────────────────────────────────────────────

export type FontSizeKey = "sm" | "md" | "lg" | "xl";

export const FONT_SIZE_PX: Record<FontSizeKey, number> = {
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
};

export const FONT_SIZE_LABELS: Record<FontSizeKey, string> = {
  sm: "小",
  md: "中",
  lg: "大",
  xl: "特大",
};

const FONT_SIZE_ORDER: FontSizeKey[] = ["sm", "md", "lg", "xl"];
const STORAGE_KEY = "pez_font_size";
const DEFAULT_SIZE: FontSizeKey = "md";

// ── 套用到 DOM ─────────────────────────────────────────────────

function applyFontSize(key: FontSizeKey) {
  if (typeof document === "undefined") return;
  document.documentElement.style.fontSize = `${FONT_SIZE_PX[key]}px`;
}

// ── Hook ───────────────────────────────────────────────────────

export function useFontSize() {
  const [size, setSizeState] = useState<FontSizeKey>(DEFAULT_SIZE);

  // 初始化：從 localStorage 讀取
  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as FontSizeKey) ?? DEFAULT_SIZE;
    const valid  = FONT_SIZE_ORDER.includes(stored) ? stored : DEFAULT_SIZE;
    setSizeState(valid);
    applyFontSize(valid);
  }, []);

  const setSize = useCallback((key: FontSizeKey) => {
    setSizeState(key);
    applyFontSize(key);
    localStorage.setItem(STORAGE_KEY, key);
  }, []);

  const increase = useCallback(() => {
    setSizeState((prev) => {
      const idx  = FONT_SIZE_ORDER.indexOf(prev);
      const next = FONT_SIZE_ORDER[Math.min(idx + 1, FONT_SIZE_ORDER.length - 1)];
      applyFontSize(next);
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const decrease = useCallback(() => {
    setSizeState((prev) => {
      const idx  = FONT_SIZE_ORDER.indexOf(prev);
      const next = FONT_SIZE_ORDER[Math.max(idx - 1, 0)];
      applyFontSize(next);
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const canIncrease = FONT_SIZE_ORDER.indexOf(size) < FONT_SIZE_ORDER.length - 1;
  const canDecrease = FONT_SIZE_ORDER.indexOf(size) > 0;

  return { size, setSize, increase, decrease, canIncrease, canDecrease };
}
