"use client";

import { useEffect } from "react";
import { FONT_SIZE_PX, type FontSizeKey } from "@/hooks/useFontSize";

/**
 * 在 layout.tsx 中掛載，恢復使用者儲存的文字大小設定。
 * 不渲染任何 DOM 節點。
 */
export function FontSizeInitializer() {
  useEffect(() => {
    const stored = localStorage.getItem("pez_font_size") as FontSizeKey | null;
    if (stored && FONT_SIZE_PX[stored]) {
      document.documentElement.style.fontSize = `${FONT_SIZE_PX[stored]}px`;
    }
  }, []);

  return null;
}
