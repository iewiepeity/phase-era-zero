"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SCENES } from "@/lib/scene-config";
import { getSceneItems } from "@/lib/content/scene-items";
import { SceneCard } from "@/components/game/SceneCard";
import { STORAGE_KEYS, NPC_COLORS, DEFAULT_NPC_COLOR } from "@/lib/constants";
import { getDifficulty, type DifficultyId } from "@/lib/content/difficulty";
import type { Scene } from "@/lib/scene-config";
import { FontSizeControl } from "@/components/ui/FontSizeControl";
import { getActionPoints, getMaxActionPoints, consumeActionPoints, syncActionPointsToDB } from "@/lib/services/action-points";
import { getNpc } from "@/lib/npc-registry";
import { getNpcEvents, markEventRead, generateNpcEvent, type NpcEvent } from "@/lib/services/npc-events";

export default function GameHubPage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;
  const router    = useRouter();

  const [showHub,           setShowHub]           = useState(false);
  const [identity,          setIdentity]          = useState<"normal" | "phase2">("normal");
  const [difficulty,        setDifficulty]        = useState<DifficultyId>("normal");
  const [currentAct,        setCurrentAct]        = useState(1);
  const [evValue,           setEvValue]           = useState(0);
  const [actJustAdvanced,   setActJustAdvanced]   = useState(false);
  // C2: 行動點
  const [actionPoints,      setActionPoints]      = useState<number>(-1);
  const [maxActionPoints,   setMaxActionPoints]   = useState(30);
  const [showApModal,       setShowApModal]       = useState(false);
  // B2: 每個場景的已探索物件數量 { [sceneId]: count }
  const [sceneProgress,     setSceneProgress]     = useState<Record<string, number>>({});
  // C6: 場景對話預覽
  type ChatPreview = { sceneId: string; messages: { npcName: string; content: string; role: string }[] };
  const [chatPreview,       setChatPreview]       = useState<ChatPreview | null>(null);
  const [previewLoading,    setPreviewLoading]    = useState(false);
  // NPC 主動事件
  const [npcEvents,         setNpcEvents]         = useState<NpcEvent[]>([]);
  const [showNpcPanel,      setShowNpcPanel]      = useState(false);

  useEffect(() => {
    const storedIdentity   = localStorage.getItem(STORAGE_KEYS.IDENTITY(sessionId));
    const storedDifficulty = localStorage.getItem(STORAGE_KEYS.DIFFICULTY(sessionId));
    const storedAct        = localStorage.getItem(`pez_act_${sessionId}`);
    const storedEv         = localStorage.getItem(`pez_ev_${sessionId}`);

    if (storedIdentity === "phase2") setIdentity("phase2");
    if (storedDifficulty) setDifficulty(storedDifficulty as DifficultyId);
    if (storedAct) {
      const parsedAct = parseInt(storedAct, 10) || 1;
      if (parsedAct > 1 && currentAct === 1) setActJustAdvanced(true);
      setCurrentAct(parsedAct);
    }
    if (storedEv) setEvValue(parseInt(storedEv, 10) || 0);

    // C2: 讀取行動點
    const ap    = getActionPoints(sessionId);
    const maxAp = getMaxActionPoints(sessionId);
    setActionPoints(ap);
    setMaxActionPoints(maxAp);

    // B2: 讀取各場景探索進度
    const progress: Record<string, number> = {};
    for (const scene of SCENES) {
      const key = STORAGE_KEYS.SCENE_INTERACTED(sessionId, scene.id);
      const raw = localStorage.getItem(key) ?? "";
      const ids = raw.split(",").filter(Boolean);
      progress[scene.id] = ids.length;
    }
    setSceneProgress(progress);

    // NPC 事件：30% 機率生成一個新事件
    if (Math.random() < 0.3) generateNpcEvent(sessionId);
    setNpcEvents(getNpcEvents(sessionId));

    setShowHub(true);
  }, [sessionId]);

  function handleEnterScene(scene: Scene) {
    // C2: 行動點檢查
    const current = getActionPoints(sessionId);
    if (current === 0) {
      setShowApModal(true);
      return;
    }

    // 消耗 1 行動點（進入場景）
    const next = consumeActionPoints(sessionId, 1);
    setActionPoints(next);
    void syncActionPointsToDB(sessionId);
    if (next === 0) setShowApModal(true);

    const key     = STORAGE_KEYS.VISITED_SCENES(sessionId);
    const visited = new Set((localStorage.getItem(key) ?? "").split(",").filter(Boolean));
    visited.add(scene.id);
    localStorage.setItem(key, [...visited].join(","));

    router.push(`/game/${sessionId}/scene/${scene.id}`);
  }

  // C6: 載入場景對話預覽
  async function handleSceneChatPreview(scene: Scene) {
    setPreviewLoading(true);
    setChatPreview({ sceneId: scene.id, messages: [] });
    try {
      const res = await fetch(`/api/game/chat-log?sessionId=${sessionId}`);
      if (!res.ok) throw new Error("failed");
      const { groups } = await res.json() as { groups: { npcId: string; messages: { role: string; content: string }[] }[] };
      // 找出屬於此場景的 NPC
      const sceneNpcIds = scene.npcs.map((n: { id: string }) => n.id);
      const msgs: { npcName: string; content: string; role: string }[] = [];
      for (const g of groups) {
        if (!sceneNpcIds.includes(g.npcId)) continue;
        const npc = getNpc(g.npcId);
        const npcName = npc?.name ?? g.npcId;
        for (const m of g.messages.slice(-6)) {
          msgs.push({ npcName, content: m.content, role: m.role });
        }
      }
      setChatPreview({ sceneId: scene.id, messages: msgs });
    } catch {
      setChatPreview({ sceneId: scene.id, messages: [] });
    } finally {
      setPreviewLoading(false);
    }
  }

  if (!showHub) return null;

  const diffDef  = getDifficulty(difficulty);
  const isPhase2 = identity === "phase2";

  return (
    <div
      className={`min-h-screen flex flex-col max-w-2xl mx-auto transition-opacity duration-700 ${showHub ? "opacity-100" : "opacity-0"}`}
    >
      {/* 頂部導覽 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#e2c9a0]/6">
        <Link
          href="/game"
          className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/55 tracking-widest transition-colors"
        >
          ← 大廳
        </Link>

        <div className="text-center">
          <p
            className="text-xs tracking-widest text-[#e2c9a0]/55"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            賽德里斯　中城區
          </p>
          <p className="font-mono-sys text-[9px] text-[#5bb8ff]/30 tracking-widest mt-0.5">
            P.E. 02 &nbsp;·&nbsp; 第 {currentAct} 幕
          </p>
        </div>

        <button
          onClick={() => router.push(`/game/${sessionId}/accuse`)}
          className="font-mono-sys text-[10px] border border-[#ff3864]/35 text-[#ff3864]/65 px-3 py-1.5 rounded hover:bg-[#ff3864]/10 hover:border-[#ff3864]/60 hover:text-[#ff3864] transition-all duration-200 tracking-wide"
        >
          指控
        </button>
      </header>

      {/* 狀態列：難度 + 身份 + EV + 字體 + 成就 + 設定 */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-[#e2c9a0]/4">
        {/* 難度標籤 */}
        <span
          className="font-mono-sys text-[9px] px-2 py-0.5 rounded-sm border tracking-widest"
          style={{
            borderColor: `${diffDef.accentColor}40`,
            color:       `${diffDef.accentColor}90`,
          }}
        >
          {diffDef.name}
        </span>

        {/* 身份標籤 */}
        {isPhase2 ? (
          <span className="font-mono-sys text-[9px] px-2 py-0.5 rounded-sm border border-[#ff3864]/35 text-[#ff3864]/70 tracking-widest">
            第二相體
          </span>
        ) : (
          <span className="font-mono-sys text-[9px] px-2 py-0.5 rounded-sm border border-[#5bb8ff]/25 text-[#5bb8ff]/50 tracking-widest">
            一般人
          </span>
        )}

        {/* Route B EV 條（A4）*/}
        {isPhase2 && (
          <div className="flex items-center gap-1.5 ml-1">
            <span className="font-mono-sys text-[9px] text-[#ff3864]/45 tracking-widest">
              EV
            </span>
            <div className="w-16 h-1 bg-[#e2c9a0]/08 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width:      `${evValue}%`,
                  background: evValue > 80
                    ? "#ff3864"
                    : evValue > 50
                    ? "#f59e0b"
                    : "rgba(255,56,100,0.55)",
                }}
              />
            </div>
            <span className="font-mono-sys text-[9px] text-[#ff3864]/35">
              {evValue}
            </span>
          </div>
        )}

        {/* C2: 行動點顯示 */}
        {actionPoints >= 0 && (
          <div className="flex items-center gap-1.5 ml-1">
            <span className="font-mono-sys text-[9px] text-[#e2c9a0]/35 tracking-widest">AP</span>
            <div className="flex gap-0.5">
              {Array.from({ length: Math.min(maxActionPoints, 20) }).map((_, i) => {
                const ratio = actionPoints / maxActionPoints;
                const filled = i < Math.round(ratio * Math.min(maxActionPoints, 20));
                return (
                  <span
                    key={i}
                    className="w-1 h-2.5 rounded-sm transition-all duration-300"
                    style={{ background: filled
                      ? actionPoints <= maxActionPoints * 0.2
                        ? "#ff3864"
                        : actionPoints <= maxActionPoints * 0.5
                        ? "#f59e0b"
                        : "#4ade80"
                      : "rgba(226,201,160,0.08)" }}
                  />
                );
              })}
            </div>
            <span
              className="font-mono-sys text-[9px] tracking-widest"
              style={{ color: actionPoints <= maxActionPoints * 0.2 ? "#ff3864" : "rgba(226,201,160,0.35)" }}
            >
              {actionPoints}
            </span>
          </div>
        )}

        <span className="flex-1" />

        {/* 字體調整 */}
        <FontSizeControl />

        {/* 設定（B3） */}
        <Link
          href={`/game/${sessionId}/settings`}
          className="font-mono-sys text-[9px] text-[#e2c9a0]/20 hover:text-[#e2c9a0]/50 tracking-widest transition-colors"
        >
          設定
        </Link>

        {/* 成就連結 */}
        <Link
          href={`/game/${sessionId}/achievements`}
          className="font-mono-sys text-[9px] text-[#e2c9a0]/20 hover:text-[#e2c9a0]/50 tracking-widest transition-colors"
        >
          成就
        </Link>
      </div>

      {/* A5: 幕次推進通知 */}
      {actJustAdvanced && (
        <div className="mx-4 mt-3 px-4 py-3 rounded border border-[#5bb8ff]/25 bg-[#5bb8ff]/05 animate-fade-in">
          <p className="font-mono-sys text-[10px] text-[#5bb8ff]/60 tracking-[0.3em] mb-1">
            CASE EVOLVING — 第二幕
          </p>
          <p
            className="text-xs text-[#e2c9a0]/55 leading-relaxed"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            你的調查已深入到足以改變事態的程度。BTMA 機構大廳現已開放。
          </p>
          <button
            onClick={() => setActJustAdvanced(false)}
            className="font-mono-sys text-[9px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/50 mt-2 tracking-widest"
          >
            收起 ×
          </button>
        </div>
      )}

      {/* NPC 主動事件通知列 */}
      {npcEvents.some((e) => !e.read) && (
        <button
          onClick={() => setShowNpcPanel(true)}
          className="mx-4 mt-3 px-4 py-2.5 rounded border border-[#5bb8ff]/25 bg-[#5bb8ff]/04 flex items-center gap-3 w-auto hover:bg-[#5bb8ff]/08 transition-colors animate-fade-in"
        >
          <span className="w-2 h-2 rounded-full bg-[#5bb8ff] animate-pulse shrink-0" />
          <p
            className="text-xs text-[#5bb8ff]/65 flex-1 text-left"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            有人找你——{npcEvents.filter((e) => !e.read).length} 條未讀訊息
          </p>
          <span className="font-mono-sys text-[9px] text-[#5bb8ff]/40 tracking-widest shrink-0">查看 →</span>
        </button>
      )}

      {/* 場景說明 */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono-sys text-[10px] text-[#5bb8ff]/35 tracking-[0.4em] uppercase">地點選擇</span>
          <span className="flex-1 h-px bg-[#5bb8ff]/10" />
        </div>
        <p
          className="text-xs text-[#e2c9a0]/35 leading-relaxed"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        >
          選擇一個地點進入，與在場的人對話，尋找線索。
        </p>
      </div>

      {/* 場景卡片 — B2: 加上探索進度 badge */}
      <div className="flex-1 px-4 py-2 space-y-3 overflow-y-auto">
        {SCENES.map((scene, idx) => {
          const totalItems   = getSceneItems(scene.id).length;
          const exploredCount = sceneProgress[scene.id] ?? 0;
          return (
            <div key={scene.id} className="relative">
              <SceneCard
                scene={scene}
                index={idx}
                onEnter={handleEnterScene}
              />
              {/* 探索進度 badge（B2）*/}
              {totalItems > 0 && (
                <span
                  className="absolute top-2 right-2 font-mono-sys text-[9px] tracking-widest px-1.5 py-0.5 rounded-sm border pointer-events-none"
                  style={{
                    borderColor: exploredCount >= totalItems
                      ? "rgba(74,222,128,0.35)"
                      : "rgba(226,201,160,0.12)",
                    color: exploredCount >= totalItems
                      ? "rgba(74,222,128,0.70)"
                      : "rgba(226,201,160,0.30)",
                    background: "rgba(13,17,23,0.85)",
                  }}
                >
                  {exploredCount}/{totalItems}
                </span>
              )}
              {/* C6: 對話摘要按鈕 */}
              {scene.npcs.length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); void handleSceneChatPreview(scene); }}
                  className="absolute bottom-2 right-2 font-mono-sys text-[8px] tracking-widest px-2 py-1 rounded-sm border border-[#5bb8ff]/18 text-[#5bb8ff]/40 hover:border-[#5bb8ff]/40 hover:text-[#5bb8ff]/70 transition-all"
                  style={{ background: "rgba(13,17,23,0.90)" }}
                >
                  💬 對話
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部操作列 */}
      <div className="px-4 py-4 border-t border-[#e2c9a0]/6 flex items-center justify-between">
        <p
          className="text-[10px] text-[#e2c9a0]/18 tracking-wide"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        >
          收集線索，建立信任，再做判斷。
        </p>
        <button
          onClick={() => router.push(`/game/${sessionId}/accuse`)}
          className="font-mono-sys text-[11px] text-[#ff3864]/55 hover:text-[#ff3864]/90 tracking-widest transition-colors"
        >
          我有答案了 →
        </button>
      </div>

      {/* 快速導覽列 */}
      <div className="px-4 pb-4 flex items-center justify-center gap-4 border-t border-[#e2c9a0]/4 pt-3 overflow-x-auto">
        <Link href={`/game/${sessionId}/map`}       className="flex flex-col items-center gap-0.5 group shrink-0">
          <span className="text-base opacity-40 group-hover:opacity-70 transition-opacity">🗺</span>
          <span className="font-mono-sys text-[8px] tracking-widest text-[#e2c9a0]/25 group-hover:text-[#e2c9a0]/55 transition-colors">地圖</span>
        </Link>
        <Link href={`/game/${sessionId}/clues`}     className="flex flex-col items-center gap-0.5 group shrink-0">
          <span className="text-base opacity-40 group-hover:opacity-70 transition-opacity">🔍</span>
          <span className="font-mono-sys text-[8px] tracking-widest text-[#e2c9a0]/25 group-hover:text-[#e2c9a0]/55 transition-colors">線索</span>
        </Link>
        <Link href={`/game/${sessionId}/inventory`} className="flex flex-col items-center gap-0.5 group shrink-0">
          <span className="text-base opacity-40 group-hover:opacity-70 transition-opacity">🎒</span>
          <span className="font-mono-sys text-[8px] tracking-widest text-[#e2c9a0]/25 group-hover:text-[#e2c9a0]/55 transition-colors">道具</span>
        </Link>
        <Link href={`/game/${sessionId}/notebook`}  className="flex flex-col items-center gap-0.5 group shrink-0">
          <span className="text-base opacity-40 group-hover:opacity-70 transition-opacity">📓</span>
          <span className="font-mono-sys text-[8px] tracking-widest text-[#e2c9a0]/25 group-hover:text-[#e2c9a0]/55 transition-colors">筆記</span>
        </Link>
        <Link href={`/game/${sessionId}/chat-log`}  className="flex flex-col items-center gap-0.5 group shrink-0">
          <span className="text-base opacity-40 group-hover:opacity-70 transition-opacity">💬</span>
          <span className="font-mono-sys text-[8px] tracking-widest text-[#e2c9a0]/25 group-hover:text-[#e2c9a0]/55 transition-colors">對話</span>
        </Link>
        <Link href={`/game/${sessionId}/settings`}  className="flex flex-col items-center gap-0.5 group shrink-0">
          <span className="text-base opacity-40 group-hover:opacity-70 transition-opacity">⚙️</span>
          <span className="font-mono-sys text-[8px] tracking-widest text-[#e2c9a0]/25 group-hover:text-[#e2c9a0]/55 transition-colors">設定</span>
        </Link>
        <Link href={`/game/${sessionId}/stats`}     className="flex flex-col items-center gap-0.5 group shrink-0">
          <span className="text-base opacity-40 group-hover:opacity-70 transition-opacity">📊</span>
          <span className="font-mono-sys text-[8px] tracking-widest text-[#e2c9a0]/25 group-hover:text-[#e2c9a0]/55 transition-colors">統計</span>
        </Link>
      </div>

      {/* C2: 行動點耗盡 Modal */}
      {showApModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" />
          <div
            className="fixed bottom-0 left-0 right-0 z-51 max-w-xl mx-auto rounded-t-2xl px-6 pt-6 pb-8 z-[51]"
            style={{ background: "#111827", borderTop: "1px solid rgba(255,56,100,0.25)" }}
          >
            <div className="w-10 h-1 rounded-full bg-[#e2c9a0]/15 mx-auto mb-5" />
            <p className="font-mono-sys text-[10px] text-[#ff3864]/60 tracking-[0.35em] uppercase text-center mb-2">
              行動點已耗盡
            </p>
            <p
              className="text-sm text-[#e2c9a0]/50 leading-loose text-center mb-6"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              你在賽德里斯的調查時間到了。<br />
              繼續等待，或做出你的判斷。
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setShowApModal(false); router.push(`/game/${sessionId}/accuse`); }}
                className="w-full py-3 rounded border border-[#ff3864]/50 text-[#ff3864]/80 font-mono-sys text-xs tracking-widest hover:bg-[#ff3864]/10 transition-colors"
              >
                我有答案了 — 直接指控
              </button>
              <button
                onClick={() => {
                  try { localStorage.setItem(STORAGE_KEYS.SILENT_ENDING(sessionId), "1"); } catch { /* ignore */ }
                  router.push(`/game/${sessionId}/result`);
                }}
                className="w-full py-3 rounded border border-[#e2c9a0]/12 text-[#e2c9a0]/30 font-mono-sys text-xs tracking-widest hover:border-[#e2c9a0]/22 hover:text-[#e2c9a0]/55 transition-colors"
              >
                沉默離開
              </button>
            </div>
          </div>
        </>
      )}

      {/* NPC 主動事件面板 */}
      {showNpcPanel && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setShowNpcPanel(false)} />
          <div
            className="fixed bottom-0 left-0 right-0 z-[51] max-w-xl mx-auto rounded-t-2xl px-5 pt-5 pb-8 max-h-[70vh] flex flex-col"
            style={{ background: "#111827", borderTop: "1px solid rgba(91,184,255,0.20)" }}
          >
            <div className="w-10 h-1 rounded-full bg-[#e2c9a0]/15 mx-auto mb-4 shrink-0" />
            <div className="flex items-center justify-between shrink-0 mb-4">
              <p className="font-mono-sys text-[10px] text-[#5bb8ff]/55 tracking-[0.3em] uppercase">NPC 訊息</p>
              <button
                onClick={() => setShowNpcPanel(false)}
                className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/55 tracking-widest"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {npcEvents.length === 0 && (
                <p
                  className="text-sm text-[#e2c9a0]/25 text-center py-6"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  還沒有訊息。
                </p>
              )}
              {npcEvents.map((evt, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 px-4 py-3 rounded border transition-colors"
                  style={{
                    borderColor: evt.read ? "rgba(226,201,160,0.08)" : "rgba(91,184,255,0.22)",
                    background:  evt.read ? "rgba(226,201,160,0.01)" : "rgba(91,184,255,0.04)",
                  }}
                >
                  {!evt.read && <span className="w-1.5 h-1.5 rounded-full bg-[#5bb8ff] mt-1.5 shrink-0" />}
                  {evt.read && <span className="w-1.5 h-1.5 mt-1.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono-sys text-[9px] text-[#5bb8ff]/55">{evt.npcName}</span>
                      <span className="font-mono-sys text-[8px] text-[#e2c9a0]/18 ml-auto">
                        {new Date(evt.timestamp).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p
                      className="text-xs text-[#e2c9a0]/60 leading-relaxed"
                      style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                    >
                      {evt.message}
                    </p>
                  </div>
                  {!evt.read && (
                    <button
                      onClick={() => {
                        markEventRead(sessionId, idx);
                        setNpcEvents(getNpcEvents(sessionId));
                      }}
                      className="font-mono-sys text-[8px] text-[#e2c9a0]/20 hover:text-[#e2c9a0]/50 tracking-widest shrink-0 mt-0.5"
                    >
                      已讀
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* C6: 場景對話預覽 Modal */}
      {chatPreview && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setChatPreview(null)} />
          <div
            className="fixed bottom-0 left-0 right-0 z-[51] max-w-xl mx-auto rounded-t-2xl px-5 pt-5 pb-8 max-h-[65vh] flex flex-col"
            style={{ background: "#111827", borderTop: "1px solid rgba(91,184,255,0.20)" }}
          >
            <div className="w-10 h-1 rounded-full bg-[#e2c9a0]/15 mx-auto mb-4 shrink-0" />
            <div className="flex items-center justify-between shrink-0 mb-3">
              <p className="font-mono-sys text-[10px] text-[#5bb8ff]/55 tracking-[0.3em] uppercase">
                對話摘要
              </p>
              <button onClick={() => setChatPreview(null)} className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/55 tracking-widest">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {previewLoading && (
                <p className="font-mono-sys text-[11px] text-[#e2c9a0]/25 text-center py-6 tracking-widest animate-neon-pulse">LOADING...</p>
              )}
              {!previewLoading && chatPreview.messages.length === 0 && (
                <p
                  className="text-sm text-[#e2c9a0]/25 text-center py-6"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  還沒有對話記錄。
                </p>
              )}
              {!previewLoading && chatPreview.messages.map((m, i) => {
                const isUser = m.role === "user";
                const color  = !isUser ? (NPC_COLORS[chatPreview.messages.find(x => x.npcName === m.npcName && x.role !== "user")?.npcName ?? ""] ?? DEFAULT_NPC_COLOR) : null;
                return (
                  <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[90%] px-3 py-1.5 rounded text-xs leading-relaxed"
                      style={isUser
                        ? { background: "rgba(226,201,160,0.06)", border: "1px solid rgba(226,201,160,0.10)", color: "rgba(226,201,160,0.60)" }
                        : { background: "rgba(91,184,255,0.05)", border: "1px solid rgba(91,184,255,0.18)", color: "rgba(226,201,160,0.65)" }
                      }
                    >
                      {!isUser && (
                        <span className="font-mono-sys text-[8px] text-[#5bb8ff]/50 block mb-0.5">{m.npcName}</span>
                      )}
                      <p style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}>{m.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="shrink-0 mt-3">
              <Link
                href={`/game/${sessionId}/chat-log`}
                onClick={() => setChatPreview(null)}
                className="block text-center font-mono-sys text-[9px] text-[#5bb8ff]/40 hover:text-[#5bb8ff]/70 tracking-widest transition-colors"
              >
                查看完整對話紀錄 →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
