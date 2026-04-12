"use client";

import { useState, useEffect, useCallback } from "react";
import { audioService, type AudioTrackId } from "@/lib/services/audio";

interface UseBgmReturn {
  play:      () => void;
  pause:     () => void;
  stop:      () => void;
  volume:    number;
  setVolume: (v: number) => void;
  isPlaying: boolean;
}

/**
 * BGM React hook
 * @param trackId 要播放的曲目 ID
 */
export function useBgm(trackId: AudioTrackId): UseBgmReturn {
  const [volume,    setVolumeState] = useState(0.4);
  const [isPlaying, setIsPlaying]   = useState(false);

  useEffect(() => {
    if (!audioService) return;
    setVolumeState(audioService.volume);
    setIsPlaying(audioService.isPlaying(trackId));
  }, [trackId]);

  const play = useCallback(() => {
    if (!audioService) return;
    audioService.play(trackId);
    setIsPlaying(true);
  }, [trackId]);

  const pause = useCallback(() => {
    if (!audioService) return;
    audioService.pause();
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    if (!audioService) return;
    audioService.stop();
    setIsPlaying(false);
  }, []);

  const setVolume = useCallback((v: number) => {
    if (!audioService) return;
    audioService.setVolume(v);
    setVolumeState(v);
  }, []);

  return { play, pause, stop, volume, setVolume, isPlaying };
}
