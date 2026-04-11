"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getScene } from "@/lib/scene-config";
import { getSceneItems } from "@/lib/content/scene-items";
import type { SceneItem } from "@/lib/content/scene-items";
import { STORAGE_KEYS, NPC_COLORS, DEFAULT_NPC_COLOR, SCENE_PALETTE, DEFAULT_SCENE_PALETTE } from "@/lib/constants";
import { SCENE_ATMOSPHERE } from "@/lib/content/narrative";
import { SCENE_ACTIONS } from "@/lib/content/action-options";
import { ActionPanel } from "@/components/game/ActionPanel";
import { TutorialOverlay } from "@/components/game/TutorialOverlay";
import { getRandomNpcsForScene } from "@/lib/services/random-npc";
import type { RandomNpcTemplate } from "@/lib/content/random-npcs";

// ── Typewriter hook ────────────────────────────────────────────

function useTypewriter(text: string, speed = 20, enabled = true) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setDisplayed(text);
      setDone(true);
      return;
    }
    setDisplayed("");
    setDone(false);
    if (!text) { setDone(true); return; }

    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, enabled]);

  return { displayed, done };
}

// ── CSS icon by type (no emoji) ───────────────────────────────

function ItemTypeIcon({ type, accentColor }: { type: SceneItem["type"]; accentColor: string }) {
  if (type === "npc") {
    return (
      <span
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
        style={{ borderColor: accentColor, background: `${accentColor}20` }}
      />
    );
  }
  if (type === "item") {
    return (
      <span
        className="w-4 h-4 rounded-sm border shrink-0"
        style={{ borderColor: "#f59e0b", background: "#f59e0b20" }}
      />
    );
  }
  if (type === "clue") {
    return (
      <span
        className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[14px] shrink-0"
        style={{ borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: "#ff3864" }}
      />
    );
  }
  // environment
  return (
    <span
      className="w-4 h-4 rounded-full border shrink-0"
      style={{ borderColor: "#5bb8ff", background: "#5bb8ff10" }}
    />
  );
}

// ── Group items by type ────────────────────────────────────────

const TYPE_ORDER: SceneItem["type"][] = ["npc", "item", "clue", "environment"];

const TYPE_LABELS: Record<SceneItem["type"], string> = {
  npc:         "人物",
  item:        "物品",
  clue:        "環境線索",
  environment: "環境",
};

const TYPE_ACCENT: Record<SceneItem["type"], string> = {
  npc:         "",   // uses NPC_COLORS, filled per-item
  item:        "#f59e0b",
  clue:        "#ff3864",
  environment: "#5bb8ff",
};

// Items visible by default (no investigation needed)
const ALWAYS_VISIBLE: SceneItem["type"][] = ["npc"];

// ── Main Page ──────────────────────────────────────────────────

export default function ScenePage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;
  const sceneId   = params.sceneId   as string;
  const router    = useRouter();

  const scene      = getScene(sceneId);
  const items      = getSceneItems(sceneId);
  const palette    = SCENE_PALETTE[sceneId] ?? DEFAULT_SCENE_PALETTE;
  const randomNpcs = useMemo(() => getRandomNpcsForScene(sceneId, sessionId), [sceneId, sessionId]);

  // State
  const [interactedItems, setInteractedItems] = useState<Set<string>>(new Set());
  // Items revealed through investigation (persisted in localStorage)
  const [discoveredItems, setDiscoveredItems] = useState<Set<string>>(new Set());
  const [activeItem,      setActiveItem]      = useState<SceneItem | null>(null);
  const [actionDone,      setActionDone]      = useState(false);
  const [introShown,      setIntroShown]      = useState(false);
  const [skipIntro,       setSkipIntro]       = useState(false);
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);
  const [investigating,   setInvestigating]   = useState(false);
  const [justDiscovered,  setJustDiscovered]  = useState<string[]>([]);

  // Atmosphere intro text
  const atmosphereText = SCENE_ATMOSPHERE[sceneId] ?? "";
  const { displayed: introText, done: introDone } = useTypewriter(
    atmosphereText,
    22,
    !skipIntro && !introShown,
  );

  // Non-NPC items that can be discovered through investigation
  const investigatableItems = items.filter((i) => !ALWAYS_VISIBLE.includes(i.type));
  const undiscoveredItems   = investigatableItems.filter((i) => !discoveredItems.has(i.id));
  const allDiscovered       = undiscoveredItems.length === 0 && investigatableItems.length > 0;

  const discoveredStorageKey = `pez_discovered_${sessionId}_${sceneId}`;

  // On mount: load state + record visit + sync DB
  useEffect(() => {
    // Load interacted items
    const key = STORAGE_KEYS.SCENE_INTERACTED(sessionId, sceneId);
    const raw = localStorage.getItem(key) ?? "";
    const ids = new Set(raw.split(",").filter(Boolean));
    setInteractedItems(ids);

    // Load discovered items
    const discoveredRaw = localStorage.getItem(discoveredStorageKey) ?? "";
    const discoveredIds = new Set(discoveredRaw.split(",").filter(Boolean));
    setDiscoveredItems(discoveredIds);

    // Record scene visit
    fetch("/api/game/scene/visits", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ sessionId, sceneId }),
    }).catch(() => {});

    // Sync DB interactions to localStorage
    fetch(`/api/game/scene/interactions?sessionId=${sessionId}&sceneId=${sceneId}`)
      .then((r) => r.json())
      .then((data: { interactions?: { item_id: string }[] }) => {
        if (data.interactions?.length) {
          const merged = new Set(ids);
          data.interactions.forEach((i) => merged.add(i.item_id));
          setInteractedItems(merged);
          localStorage.setItem(key, [...merged].join(","));
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, sceneId]);

  // Auto-advance intro after it finishes
  useEffect(() => {
    if (introDone && !introShown) {
      const t = setTimeout(() => setIntroShown(true), 900);
      return () => clearTimeout(t);
    }
  }, [introDone, introShown]);

  const markInteracted = useCallback(
    (itemId: string) => {
      setInteractedItems((prev) => {
        const next = new Set(prev);
        next.add(itemId);
        const key = STORAGE_KEYS.SCENE_INTERACTED(sessionId, sceneId);
        localStorage.setItem(key, [...next].join(","));
        return next;
      });
    },
    [sessionId, sceneId],
  );

  // Investigation: reveal 1-2 random undiscovered items
  function handleInvestigate() {
    if (investigating || undiscoveredItems.length === 0) return;
    setInvestigating(true);

    // Deterministic shuffle based on current count so each call reveals different items
    const shuffled = [...undiscoveredItems].sort(
      () => (Math.sin(Date.now() % 997) > 0 ? 1 : -1)
    );
    const toReveal  = shuffled.slice(0, Math.min(2, shuffled.length));
    const newlyFound = toReveal.map((i) => i.id);

    setDiscoveredItems((prev) => {
      const next = new Set(prev);
      newlyFound.forEach((id) => next.add(id));
      localStorage.setItem(discoveredStorageKey, [...next].join(","));
      return next;
    });
    setJustDiscovered(newlyFound);

    setTimeout(() => {
      setJustDiscovered([]);
      setInvestigating(false);
    }, 2000);
  }

  function handleItemClick(item: SceneItem) {
    setActiveItem(item);
    setActionDone(false);
  }

  function closeModal() {
    setActiveItem(null);
    setActionDone(false);
  }

  async function handleAction(item: SceneItem) {
    if (actionDone) return;

    const interactionType =
      item.type === "npc"        ? "talk"    :
      item.pickable              ? "pickup"  :
      item.triggersClue          ? "discover":
                                   "examine";

    markInteracted(item.id);

    fetch("/api/game/scene/interactions", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ sessionId, sceneId, itemId: item.id, interactionType }),
    }).catch(() => {});

    if (item.type === "npc" && item.npcId) {
      router.push(`/game/${sessionId}/chat/${item.npcId}`);
      return;
    }

    setActionDone(true);
    setTimeout(() => { closeModal(); }, 1500);
  }

  function getActionLabel(item: SceneItem): string {
    if (item.type === "npc")   return "對話";
    if (item.pickable)         return "拾取";
    if (item.triggersClue)     return "紀錄線索";
    return "檢查";
  }

  function getSuccessMessage(item: SceneItem): string {
    if (item.pickable)     return "已加入道具欄";
    if (item.triggersClue) return "線索已記錄";
    return "已檢查";
  }

  // ActionPanel handlers
  function handlePanelExplore(targetItemId: string) {
    setHighlightedItem(targetItemId);
    const el = document.getElementById(`item-${targetItemId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlightedItem(null), 2000);
  }

  function handlePanelNavigate(npcId: string) {
    router.push(`/game/${sessionId}/chat/${npcId}`);
  }

  function handlePanelLeave() {
    router.push(`/game/${sessionId}/map`);
  }

  // Filter items to display: NPCs always, others only if discovered
  function isVisible(item: SceneItem): boolean {
    if (ALWAYS_VISIBLE.includes(item.type)) return true;
    return discoveredItems.has(item.id);
  }

  // Group items — only visible ones
  const grouped = TYPE_ORDER.reduce(
    (acc, type) => {
      acc[type] = items.filter((i) => i.type === type && isVisible(i));
      return acc;
    },
    {} as Record<SceneItem["type"], SceneItem[]>,
  );

  // Total interacted across visible items
  const visibleItems = items.filter(isVisible);

  if (!scene) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <p className="text-[#e2c9a0]/40 font-mono-sys text-xs">場景不存在</p>
      </div>
    );
  }

  // ── Intro overlay ──────────────────────────────────────────
  if (!introShown && !skipIntro) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-[#0d1117] px-8"
        onClick={() => {
          if (introDone) setIntroShown(true);
          else setSkipIntro(true);
        }}
      >
        <div className="fixed inset-0 bg-grid-static opacity-30 pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-sm w-full">
          <p className="font-mono-sys text-[9px] tracking-[0.4em] text-[#e2c9a0]/25 mb-6 uppercase">
            {scene.district}
          </p>
          <h1
            className="text-xl tracking-widest mb-8"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif", color: palette.accent }}
          >
            {scene.name}
          </h1>
          <p
            className="text-sm leading-loose text-[#e2c9a0]/75 min-h-[8rem]"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            {introText}
            {!introDone && <span className="animate-pulse">▌</span>}
          </p>
          <p className="font-mono-sys text-[9px] text-[#e2c9a0]/20 mt-10 tracking-widest">
            {introDone ? "點擊繼續" : "點擊略過"}
          </p>
        </div>
      </div>
    );
  }

  // ── Main scene view ────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117]">
      <div className="fixed inset-0 bg-grid-static opacity-30 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex-1 max-w-xl mx-auto w-full px-5 pt-8 pb-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/game/${sessionId}/map`}
            className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/55 tracking-widest transition-colors"
          >
            ← 地圖
          </Link>
          <p className="font-mono-sys text-[9px] text-[#5bb8ff]/25 tracking-widest">
            SCENE
          </p>
        </div>

        {/* Scene title */}
        <div className="mb-7">
          <p
            className="font-mono-sys text-[9px] tracking-[0.4em] mb-1"
            style={{ color: `${palette.accent}60` }}
          >
            {scene.district}
          </p>
          <h1
            className="text-xl tracking-widest"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif", color: palette.accent }}
          >
            {scene.name}
          </h1>
          <p
            className="text-xs text-[#e2c9a0]/30 mt-1"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            {scene.ambience}
          </p>
        </div>

        {/* Explored progress — based on visible items only */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-[#e2c9a0]/06 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width:      `${(interactedItems.size / Math.max(visibleItems.length, 1)) * 100}%`,
                background: palette.accent,
                opacity:    0.4,
              }}
            />
          </div>
          <span className="font-mono-sys text-[9px] tracking-widest shrink-0" style={{ color: `${palette.accent}60` }}>
            {interactedItems.size}/{visibleItems.length}
          </span>
        </div>

        {/* Investigation button */}
        <div className="mb-8">
          <button
            onClick={handleInvestigate}
            disabled={investigating || allDiscovered}
            className="w-full py-3 rounded border font-mono-sys text-[10px] tracking-[0.3em] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              borderColor: allDiscovered ? "rgba(74,222,128,0.25)" : `${palette.accent}35`,
              color:        allDiscovered ? "rgba(74,222,128,0.60)" : `${palette.accent}70`,
              background:   allDiscovered ? "rgba(74,222,128,0.05)" : `${palette.accent}08`,
            }}
          >
            {investigating
              ? "搜查中..."
              : allDiscovered
              ? "[ 此區域已全面搜查 ]"
              : undiscoveredItems.length === investigatableItems.length
              ? "[ 調查此區域 ]"
              : `[ 繼續搜查 — 還有 ${undiscoveredItems.length} 處未發現 ]`}
          </button>

          {/* Newly discovered notification */}
          {justDiscovered.length > 0 && (
            <div className="mt-2 px-3 py-2 rounded border border-[#f59e0b]/25 bg-[#f59e0b]/05 animate-fade-in">
              <p className="font-mono-sys text-[9px] tracking-[0.3em] text-[#f59e0b]/60 mb-1">
                發現新物件
              </p>
              {justDiscovered.map((id) => {
                const found = items.find((i) => i.id === id);
                return found ? (
                  <p
                    key={id}
                    className="text-xs text-[#e2c9a0]/65"
                    style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                  >
                    · {found.name}
                  </p>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Action suggestions */}
        {SCENE_ACTIONS[sceneId] && (
          <div className="mb-8">
            <ActionPanel
              options={SCENE_ACTIONS[sceneId]}
              accentColor={palette.accent}
              onExplore={handlePanelExplore}
              onNavigate={handlePanelNavigate}
              onLeave={handlePanelLeave}
            />
          </div>
        )}

        {/* Items grouped by type */}
        <div className="space-y-8">
          {TYPE_ORDER.map((type) => {
            const group = grouped[type];
            if (!group || group.length === 0) return null;

            const accent = TYPE_ACCENT[type];

            return (
              <section key={type}>
                {/* Section header */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="font-mono-sys text-[9px] tracking-[0.4em] uppercase"
                    style={{ color: accent || "rgba(226,201,160,0.30)" }}
                  >
                    {TYPE_LABELS[type]}
                  </span>
                  <span className="flex-1 h-px" style={{ background: `${accent || "rgba(226,201,160,0.06)"}30` }} />
                  {type !== "npc" && (
                    <span
                      className="font-mono-sys text-[8px] tracking-widest animate-fade-in"
                      style={{ color: `${accent}50` }}
                    >
                      [已發現]
                    </span>
                  )}
                </div>

                {/* Item cards */}
                <div className="space-y-2">
                  {group.map((item) => {
                    const interacted = interactedItems.has(item.id);
                    const isNew      = justDiscovered.includes(item.id);
                    const npcColor   = item.npcId ? (NPC_COLORS[item.npcId] ?? DEFAULT_NPC_COLOR) : null;
                    const cardAccent = type === "npc" && npcColor ? npcColor.dot : accent;

                    return (
                      <button
                        id={`item-${item.id}`}
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="w-full text-left px-4 py-3 rounded border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center gap-3"
                        style={{
                          borderColor: isNew
                            ? `${cardAccent}80`
                            : highlightedItem === item.id
                            ? `${cardAccent}70`
                            : interacted
                            ? `${cardAccent}20`
                            : `${cardAccent}30`,
                          background: isNew
                            ? `${cardAccent}18`
                            : highlightedItem === item.id
                            ? `${cardAccent}14`
                            : interacted
                            ? "rgba(13,17,23,0.5)"
                            : "rgba(13,17,23,0.8)",
                          opacity: interacted && item.oneTimeOnly ? 0.45 : 1,
                          boxShadow: isNew
                            ? `0 0 16px ${cardAccent}30`
                            : highlightedItem === item.id
                            ? `0 0 12px ${cardAccent}30`
                            : undefined,
                        }}
                      >
                        {/* CSS icon */}
                        <span className="shrink-0 flex items-center justify-center w-6" style={{ opacity: interacted ? 0.5 : 1 }}>
                          <ItemTypeIcon
                            type={item.type}
                            accentColor={type === "npc" && npcColor ? npcColor.dot : accent || "rgba(226,201,160,0.5)"}
                          />
                        </span>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              className="text-sm leading-snug truncate"
                              style={{
                                fontFamily: "var(--font-noto-serif-tc), serif",
                                color: interacted
                                  ? "rgba(226,201,160,0.35)"
                                  : "rgba(226,201,160,0.80)",
                              }}
                            >
                              {item.name}
                            </p>
                            {interacted && (
                              <span className="font-mono-sys text-[10px] shrink-0" style={{ color: `${cardAccent}70` }}>
                                [v]
                              </span>
                            )}
                          </div>
                          <p
                            className="font-mono-sys text-[9px] tracking-wide truncate mt-0.5"
                            style={{ color: "rgba(226,201,160,0.22)" }}
                          >
                            {item.shortDesc} · {item.position}
                          </p>
                        </div>

                        {/* Type badge */}
                        <span
                          className="font-mono-sys text-[8px] px-1.5 py-0.5 rounded-sm border shrink-0 tracking-wide"
                          style={{
                            borderColor: `${cardAccent}25`,
                            color:       `${cardAccent}70`,
                            background:  `${cardAccent}08`,
                          }}
                        >
                          {item.type === "npc" ? "人物" :
                           item.pickable       ? "可拾取" :
                           item.triggersClue   ? "線索" : "環境"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Random NPC section — 路人 (always visible) */}
        {randomNpcs.length > 0 && (
          <section className="mt-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono-sys text-[9px] tracking-[0.4em] uppercase text-[#e2c9a0]/20">
                路人
              </span>
              <span className="flex-1 h-px bg-[#e2c9a0]/05" />
              <span className="font-mono-sys text-[8px] text-[#e2c9a0]/15 tracking-widest">
                PASSERSBY
              </span>
            </div>
            <div className="space-y-2">
              {randomNpcs.map((rNpc: RandomNpcTemplate) => (
                <button
                  key={rNpc.id}
                  onClick={() => router.push(`/game/${sessionId}/chat/${rNpc.id}`)}
                  className="w-full text-left px-4 py-3 rounded border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center gap-3"
                  style={{ borderColor: "rgba(226,201,160,0.10)", background: "rgba(13,17,23,0.6)" }}
                >
                  {/* Person dot */}
                  <span className="w-5 h-5 rounded-full border-2 border-[#e2c9a0]/20 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className="text-sm leading-snug truncate text-[#e2c9a0]/45"
                        style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                      >
                        {rNpc.name}
                      </p>
                    </div>
                    <p className="font-mono-sys text-[9px] tracking-wide truncate mt-0.5 text-[#e2c9a0]/18">
                      {rNpc.appearance}
                    </p>
                  </div>
                  <span className="font-mono-sys text-[8px] px-1.5 py-0.5 rounded-sm border shrink-0 tracking-wide border-[#e2c9a0]/10 text-[#e2c9a0]/25 bg-[#e2c9a0]/03">
                    路人
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Deep investigation button */}
        {scene.npcs.length > 0 && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => router.push(`/game/${sessionId}/chat/${scene.npcs[0].id}`)}
              className="font-mono-sys text-[10px] tracking-[0.3em] px-5 py-2.5 rounded border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                borderColor: `${palette.accent}25`,
                color:       `${palette.accent}50`,
                background:  `${palette.accent}05`,
              }}
            >
              深入調查 →
            </button>
          </div>
        )}

      </div>

      {/* Bottom Modal / Drawer */}
      {activeItem && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Drawer */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 max-w-xl mx-auto rounded-t-2xl px-6 pt-5 pb-8"
            style={{ background: "#111827", borderTop: `1px solid ${palette.accent}20` }}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full bg-[#e2c9a0]/15 mx-auto mb-5" />

            {/* Item header */}
            <div className="flex items-center gap-3 mb-4">
              <span className="shrink-0">
                <ItemTypeIcon
                  type={activeItem.type}
                  accentColor={
                    activeItem.type === "npc" && activeItem.npcId
                      ? (NPC_COLORS[activeItem.npcId] ?? DEFAULT_NPC_COLOR).dot
                      : TYPE_ACCENT[activeItem.type] || "rgba(226,201,160,0.5)"
                  }
                />
              </span>
              <div>
                <h2
                  className="text-base tracking-widest text-[#e2c9a0]/85"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  {activeItem.name}
                </h2>
                <p className="font-mono-sys text-[9px] text-[#e2c9a0]/25 tracking-widest mt-0.5">
                  {activeItem.position}
                </p>
              </div>
            </div>

            {/* Inspect text */}
            <p
              className="text-sm leading-loose text-[#e2c9a0]/65 mb-6"
              style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
            >
              {activeItem.inspectText}
            </p>

            {/* Action button or success state */}
            {actionDone ? (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded border"
                style={{ borderColor: `${palette.accent}30`, background: `${palette.accent}08` }}
              >
                <span className="font-mono-sys text-[10px]" style={{ color: palette.accent }}>[v]</span>
                <p
                  className="text-sm text-[#e2c9a0]/60"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  {getSuccessMessage(activeItem)}
                </p>
              </div>
            ) : (
              <button
                onClick={() => handleAction(activeItem)}
                className="w-full py-3 rounded border font-mono-sys text-xs tracking-widest transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  borderColor: `${palette.accent}40`,
                  color:       palette.accent,
                  background:  `${palette.accent}10`,
                }}
              >
                {getActionLabel(activeItem)}
              </button>
            )}
          </div>
        </>
      )}

      {/* C5: 新手引導 */}
      <TutorialOverlay kind="scene" />
    </div>
  );
}
