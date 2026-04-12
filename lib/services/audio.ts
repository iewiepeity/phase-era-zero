/**
 * 音訊服務 — BGM 管理
 * 主 BGM：/bgm/Zero.mp3
 * 所有方法在 Web Audio API 不可用時為 no-op
 */

export type AudioTrackId =
  | "main_theme"
  | "investigation"
  | "tension"
  | "night_scene"
  | "port_ambience"
  | "lab_hum"
  | "precinct_noise"
  | "resolution";

export interface AudioTrack {
  id:    AudioTrackId;
  label: string;
  src:   string;   // 相對路徑（預留，檔案尚未存在）
  loop:  boolean;
  mood:  "calm" | "tense" | "mystery" | "ambient";
}

export const AUDIO_TRACKS: Record<AudioTrackId, AudioTrack> = {
  main_theme:      { id: "main_theme",      label: "主題曲",          src: "/bgm/Zero.mp3",              loop: true,  mood: "mystery"  },
  investigation:   { id: "investigation",   label: "調查時段",        src: "/bgm/Zero.mp3",              loop: true,  mood: "calm"     },
  tension:         { id: "tension",         label: "緊張時刻",        src: "/bgm/Zero.mp3",              loop: true,  mood: "tense"    },
  night_scene:     { id: "night_scene",     label: "深夜場景",        src: "/bgm/Zero.mp3",              loop: true,  mood: "mystery"  },
  port_ambience:   { id: "port_ambience",   label: "霧港氛圍",        src: "/bgm/Zero.mp3",              loop: true,  mood: "ambient"  },
  lab_hum:         { id: "lab_hum",         label: "實驗室低鳴",      src: "/bgm/Zero.mp3",              loop: true,  mood: "tense"    },
  precinct_noise:  { id: "precinct_noise",  label: "分局背景音",      src: "/bgm/Zero.mp3",              loop: true,  mood: "calm"     },
  resolution:      { id: "resolution",      label: "結局",            src: "/bgm/Zero.mp3",              loop: false, mood: "mystery"  },
};

class AudioService {
  private audio:   HTMLAudioElement | null = null;
  private current: AudioTrackId | null     = null;
  private _volume  = 0.4;
  private enabled  = false;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("pez_audio_enabled");
      this.enabled = stored === null ? true : stored === "true";
        const vol    = parseFloat(localStorage.getItem("pez_audio_volume") ?? "0.4");
        this._volume = isNaN(vol) ? 0.4 : Math.max(0, Math.min(1, vol));
      } catch { /* ignore */ }
    }
  }

  get volume(): number { return this._volume; }

  play(trackId: AudioTrackId): void {
    if (!this.enabled || typeof window === "undefined") return;
    if (this.current === trackId) return;
    this.stop();
    try {
      const track  = AUDIO_TRACKS[trackId];
      this.audio   = new Audio(track.src);
      this.audio.loop   = track.loop;
      this.audio.volume = this._volume;
      this.audio.play().catch(() => {});
      this.current = trackId;
    } catch { /* no-op */ }
  }

  pause(): void {
    this.audio?.pause();
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.current = null;
  }

  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.audio) this.audio.volume = this._volume;
    try {
      localStorage.setItem("pez_audio_volume", String(this._volume));
    } catch { /* ignore */ }
  }

  setEnabled(val: boolean): void {
    this.enabled = val;
    try {
      localStorage.setItem("pez_audio_enabled", val ? "true" : "false");
    } catch { /* ignore */ }
    if (!val) this.stop();
  }

  isPlaying(trackId?: AudioTrackId): boolean {
    if (!this.audio || this.audio.paused) return false;
    if (trackId) return this.current === trackId;
    return true;
  }

  getCurrentTrack(): AudioTrackId | null { return this.current; }
}

// Singleton
export const audioService = typeof window !== "undefined"
  ? new AudioService()
  : null;
