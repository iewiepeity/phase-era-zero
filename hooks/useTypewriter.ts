"use client";

import { useState, useEffect } from "react";

interface UseTypewriterOptions {
  /** 要逐字顯示的完整文字 */
  text:     string;
  /** 每字之間的間隔（毫秒），預設 20 */
  speed?:   number;
  /** 是否啟動打字機，預設 true */
  enabled?: boolean;
}

interface UseTypewriterReturn {
  /** 目前已顯示的文字片段 */
  displayed: string;
  /** 是否已打字完成 */
  isDone:    boolean;
  /** 立即跳至末尾（略過按鈕用）*/
  skip:      () => void;
}

/**
 * 打字機效果 hook。
 * 逐字顯示 `text`，可透過 `skip()` 跳到結尾。
 * 當 `text` 改變時會自動從頭重播。
 *
 * @example
 * const { displayed, isDone, skip } = useTypewriter({ text: INTRO_TEXT, speed: 20 });
 */
export function useTypewriter({
  text,
  speed   = 20,
  enabled = true,
}: UseTypewriterOptions): UseTypewriterReturn {
  const [typedLen, setTypedLen] = useState(0);

  // text 改變時重置
  useEffect(() => {
    setTypedLen(0);
  }, [text]);

  const isDone = typedLen >= text.length;

  useEffect(() => {
    if (!enabled || isDone) return;
    const t = setTimeout(() => setTypedLen((n) => n + 1), speed);
    return () => clearTimeout(t);
  }, [typedLen, isDone, speed, enabled]);

  return {
    displayed: text.slice(0, typedLen),
    isDone,
    skip:      () => setTypedLen(text.length),
  };
}
