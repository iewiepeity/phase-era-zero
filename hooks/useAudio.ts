"use client";

/**
 * useAudio — 音效系統 React 鉤子
 *
 * 提供元件層面的 BGM/SFX 控制與設定管理。
 * 所有操作在音檔未就緒時均安全忽略。
 */

import { useState, useEffect, useCallback } from "react";
import {
  playBgm, stopBgm, pauseBgm, resumeBgm, playSfx,
  isAudioMuted, setAudioMuted, isSfxMuted, setSfxMuted,
  getGlobalVolume, setGlobalVolume, getCurrentBgmId,
  type BgmTrackId, type SfxId,
} from "@/lib/services/audio";

export interface UseAudioReturn {
  muted:         boolean;
  sfxMuted:      boolean;
  volume:        number;
  currentBgm:    BgmTrackId | null;
  isPaused:      boolean;
  play:          (trackId: BgmTrackId) => void;
  stop:          () => void;
  togglePause:   () => void;
  sfx:           (sfxId: SfxId) => void;
  toggleMute:    () => void;
  toggleSfxMute: () => void;
  setVolume:     (v: number) => void;
}

export function useAudio(): UseAudioReturn {
  const [muted,      setMutedState]    = useState(false);
  const [sfxMuted,   setSfxMutedState] = useState(false);
  const [volume,     setVolumeState]   = useState(0.7);
  const [currentBgm, setCurrentBgm]   = useState<BgmTrackId | null>(null);
  const [isPaused,   setIsPaused]      = useState(false);

  // 初始化：從 localStorage 讀取設定
  useEffect(() => {
    setMutedState(isAudioMuted());
    setSfxMutedState(isSfxMuted());
    setVolumeState(getGlobalVolume());
    setCurrentBgm(getCurrentBgmId());
  }, []);

  const play = useCallback((trackId: BgmTrackId) => {
    playBgm(trackId);
    setCurrentBgm(trackId);
    setIsPaused(false);
  }, []);

  const stop = useCallback(() => {
    stopBgm();
    setCurrentBgm(null);
    setIsPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      if (prev) { resumeBgm(); return false; }
      else       { pauseBgm();  return true;  }
    });
  }, []);

  const sfx = useCallback((sfxId: SfxId) => {
    playSfx(sfxId);
  }, []);

  const toggleMute = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      setAudioMuted(next);
      if (next) pauseBgm();
      else      resumeBgm();
      return next;
    });
  }, []);

  const toggleSfxMute = useCallback(() => {
    setSfxMutedState((prev) => {
      const next = !prev;
      setSfxMuted(next);
      return next;
    });
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setGlobalVolume(clamped);
    setVolumeState(clamped);
  }, []);

  return {
    muted, sfxMuted, volume, currentBgm, isPaused,
    play, stop, togglePause, sfx,
    toggleMute, toggleSfxMute, setVolume,
  };
}
