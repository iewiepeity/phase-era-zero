/**
 * 音效服務 — BGM 與 SFX 控制的預留框架
 *
 * 目前為存根（stub）實作，等待音檔資源後啟用。
 * 所有函式皆安全呼叫，無音檔時靜默忽略錯誤。
 *
 * 架構：
 *   BGM — 單一頻道，淡入淡出切換
 *   SFX — 事件音效，可疊加播放
 *   設定 — localStorage 儲存靜音/音量
 */

// ── 音軌定義 ─────────────────────────────────────────────────

export type BgmTrackId =
  | "main_theme"    // 主選單
  | "investigation" // 調查階段（Hub / 場景瀏覽）
  | "tension"       // 緊張（線索揭露、事件觸發）
  | "conversation"  // 對話階段
  | "dawn"          // 清晨時段
  | "dusk"          // 傍晚時段
  | "midnight"      // 深夜時段
  | "btma"          // BTMA 大廳（科技感）
  | "harbor"        // 港口場景（環境音）
  | "result_win"    // 破案成功
  | "result_lose"   // 調查失敗
  | "route_b"       // B 路線主題（侵蝕感）
  | "tutorial";     // 教學關卡

export type SfxId =
  | "clue_found"      // 發現線索
  | "achievement"     // 成就解鎖
  | "trust_up"        // 信任度提升
  | "trust_down"      // 信任度下降
  | "ev_warning"      // EV 警告
  | "scene_enter"     // 進入場景
  | "message_send"    // 發送訊息
  | "message_receive" // 收到訊息
  | "door_open"       // 開門音效
  | "notification"    // 系統通知
  | "button_click"    // 按鈕點擊
  | "item_pickup"     // 撿起道具
  | "item_combine"    // 道具組合成功
  | "accuse_submit"   // 提交指控
  | "act_advance";    // 幕次推進

/** 音軌對應的預留音檔路徑（音檔就緒後放置到 public/audio/ 即可生效）*/
export const BGM_TRACKS: Record<BgmTrackId, { path: string; loop: boolean; volume: number }> = {
  main_theme:   { path: "/audio/bgm/main_theme.mp3",   loop: true,  volume: 0.6  },
  investigation:{ path: "/audio/bgm/investigation.mp3", loop: true,  volume: 0.5  },
  tension:      { path: "/audio/bgm/tension.mp3",       loop: true,  volume: 0.55 },
  conversation: { path: "/audio/bgm/conversation.mp3",  loop: true,  volume: 0.4  },
  dawn:         { path: "/audio/bgm/dawn.mp3",          loop: true,  volume: 0.45 },
  dusk:         { path: "/audio/bgm/dusk.mp3",          loop: true,  volume: 0.5  },
  midnight:     { path: "/audio/bgm/midnight.mp3",      loop: true,  volume: 0.5  },
  btma:         { path: "/audio/bgm/btma.mp3",          loop: true,  volume: 0.5  },
  harbor:       { path: "/audio/bgm/harbor.mp3",        loop: true,  volume: 0.55 },
  result_win:   { path: "/audio/bgm/result_win.mp3",    loop: false, volume: 0.65 },
  result_lose:  { path: "/audio/bgm/result_lose.mp3",   loop: false, volume: 0.6  },
  route_b:      { path: "/audio/bgm/route_b.mp3",       loop: true,  volume: 0.5  },
  tutorial:     { path: "/audio/bgm/tutorial.mp3",      loop: true,  volume: 0.45 },
};

export const SFX_TRACKS: Record<SfxId, { path: string; volume: number }> = {
  clue_found:     { path: "/audio/sfx/clue_found.mp3",     volume: 0.7  },
  achievement:    { path: "/audio/sfx/achievement.mp3",     volume: 0.7  },
  trust_up:       { path: "/audio/sfx/trust_up.mp3",        volume: 0.5  },
  trust_down:     { path: "/audio/sfx/trust_down.mp3",      volume: 0.5  },
  ev_warning:     { path: "/audio/sfx/ev_warning.mp3",      volume: 0.65 },
  scene_enter:    { path: "/audio/sfx/scene_enter.mp3",     volume: 0.4  },
  message_send:   { path: "/audio/sfx/message_send.mp3",    volume: 0.35 },
  message_receive:{ path: "/audio/sfx/message_receive.mp3", volume: 0.4  },
  door_open:      { path: "/audio/sfx/door_open.mp3",       volume: 0.5  },
  notification:   { path: "/audio/sfx/notification.mp3",    volume: 0.55 },
  button_click:   { path: "/audio/sfx/button_click.mp3",    volume: 0.3  },
  item_pickup:    { path: "/audio/sfx/item_pickup.mp3",     volume: 0.5  },
  item_combine:   { path: "/audio/sfx/item_combine.mp3",    volume: 0.6  },
  accuse_submit:  { path: "/audio/sfx/accuse_submit.mp3",   volume: 0.7  },
  act_advance:    { path: "/audio/sfx/act_advance.mp3",     volume: 0.65 },
};

// ── 設定 localStorage 鍵 ──────────────────────────────────────

const KEY_MUTED     = "pez_audio_muted";
const KEY_SFX_MUTED = "pez_sfx_muted";
const KEY_VOLUME    = "pez_audio_volume";

// ── 設定讀寫 ─────────────────────────────────────────────────

export function isAudioMuted(): boolean {
  try { return localStorage.getItem(KEY_MUTED) === "true"; }
  catch { return false; }
}

export function setAudioMuted(muted: boolean): void {
  try { localStorage.setItem(KEY_MUTED, String(muted)); }
  catch { /* ignore */ }
}

export function isSfxMuted(): boolean {
  try { return localStorage.getItem(KEY_SFX_MUTED) === "true"; }
  catch { return false; }
}

export function setSfxMuted(muted: boolean): void {
  try { localStorage.setItem(KEY_SFX_MUTED, String(muted)); }
  catch { /* ignore */ }
}

export function getGlobalVolume(): number {
  try {
    const raw = localStorage.getItem(KEY_VOLUME);
    if (!raw) return 0.7;
    return Math.max(0, Math.min(1, parseFloat(raw) || 0.7));
  } catch { return 0.7; }
}

export function setGlobalVolume(volume: number): void {
  try {
    localStorage.setItem(KEY_VOLUME, String(Math.max(0, Math.min(1, volume))));
  } catch { /* ignore */ }
}

// ── 音訊實例管理 ──────────────────────────────────────────────

let currentBgm:   HTMLAudioElement | null = null;
let currentBgmId: BgmTrackId | null       = null;

function createAudio(path: string, volume: number, loop: boolean): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  try {
    const audio  = new Audio(path);
    audio.volume = volume * getGlobalVolume();
    audio.loop   = loop;
    return audio;
  } catch { return null; }
}

// ── BGM 控制 ──────────────────────────────────────────────────

/** 播放 BGM。若同一首已在播放則不重新開始。音檔未就緒時靜默忽略。*/
export function playBgm(trackId: BgmTrackId): void {
  if (isAudioMuted()) return;
  if (currentBgmId === trackId && currentBgm && !currentBgm.paused) return;

  const def   = BGM_TRACKS[trackId];
  stopBgm();

  const audio = createAudio(def.path, def.volume, def.loop);
  if (!audio) return;

  currentBgm   = audio;
  currentBgmId = trackId;

  audio.play().catch(() => {
    currentBgm   = null;
    currentBgmId = null;
  });
}

export function stopBgm(): void {
  if (!currentBgm) return;
  try {
    currentBgm.pause();
    currentBgm.currentTime = 0;
  } catch { /* ignore */ }
  currentBgm   = null;
  currentBgmId = null;
}

export function pauseBgm(): void {
  try { currentBgm?.pause(); } catch { /* ignore */ }
}

export function resumeBgm(): void {
  if (isAudioMuted() || !currentBgm) return;
  currentBgm.play().catch(() => { /* ignore */ });
}

export function getCurrentBgmId(): BgmTrackId | null {
  return currentBgmId;
}

// ── SFX 控制 ──────────────────────────────────────────────────

/** 播放音效（fire-and-forget）。音檔未就緒時靜默忽略。*/
export function playSfx(sfxId: SfxId): void {
  if (isAudioMuted() || isSfxMuted()) return;
  const def   = SFX_TRACKS[sfxId];
  const audio = createAudio(def.path, def.volume, false);
  if (!audio) return;
  audio.play().catch(() => { /* ignore */ });
}

// ── 場景音樂建議 ──────────────────────────────────────────────

/** 根據場景 ID 建議要播放的 BGM */
export function getBgmForScene(sceneId: string): BgmTrackId {
  const sceneMap: Record<string, BgmTrackId> = {
    chen_jie_noodles:    "investigation",
    crime_scene:         "tension",
    foggy_port:          "harbor",
    ninth_precinct:      "investigation",
    bai_qiu_pharmacy:    "investigation",
    medical_center:      "investigation",
    lin_lab:             "tension",
    btma_lobby:          "btma",
    abandoned_warehouse: "tension",
    zhengbo_office:      "investigation",
  };
  return sceneMap[sceneId] ?? "investigation";
}

/** 根據時段建議要播放的 BGM */
export function getBgmForTimePeriod(period: string): BgmTrackId {
  const map: Record<string, BgmTrackId> = {
    dawn:      "dawn",
    afternoon: "investigation",
    dusk:      "dusk",
    midnight:  "midnight",
  };
  return (map[period] as BgmTrackId | undefined) ?? "investigation";
}
