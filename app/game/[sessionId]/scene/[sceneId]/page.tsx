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
import { getSceneConversations, type NpcConversation } from "@/lib/content/npc-conversations";
import { getCurrentTimePeriod, getNpcAvailability, getTimePeriod } from "@/lib/services/time-system";
import { findItemCombination, type ItemCombinationRecipe } from "@/lib/content/item-combinations";
// event-system handled at Hub level

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
  const [activeItem,      setActiveItem]      = useState<SceneItem | null>(null);
  const [actionDone,      setActionDone]      = useState(false);
  const [introShown,      setIntroShown]      = useState(false);
  const [skipIntro,       setSkipIntro]       = useState(false);
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);
  const [showOverheard,   setShowOverheard]   = useState(false);
  const overheardConvos = getSceneConversations(sceneId);
  // 時段 NPC 可用性
  const currentPeriod = getCurrentTimePeriod(sessionId);
  // 道具使用
  const [showItemUse,     setShowItemUse]     = useState(false);
  const [comboResult,     setComboResult]     = useState<ItemCombinationRecipe | null>(null);

  // Atmosphere intro text
  const atmosphereText = SCENE_ATMOSPHERE[sceneId] ?? "";
  const { displayed: introText, done: introDone } = useTypewriter(
    atmosphereText,
    22,
    !skipIntro && !introShown,
  );

  // On mount: load state + record visit + sync DB
  useEffect(() => {
    // Load localStorage
    const key = STORAGE_KEYS.SCENE_INTERACTED(sessionId, sceneId);
    const raw = localStorage.getItem(key) ?? "";
    const ids = new Set(raw.split(",").filter(Boolean));
    setInteractedItems(ids);

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

    // 進入場景時觸發隨機事件檢查
    // Event check on scene entry handled by Hub page
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

    // Mark interacted
    markInteracted(item.id);

    // Persist to DB
    fetch("/api/game/scene/interactions", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ sessionId, sceneId, itemId: item.id, interactionType }),
    }).catch(() => {});

    if (item.type === "npc" && item.npcId) {
      // Navigate directly to chat
      router.push(`/game/${sessionId}/chat/${item.npcId}`);
      return;
    }

    setActionDone(true);

    // Auto-close after 1.5s
    setTimeout(() => {
      closeModal();
    }, 1500);
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

  // Group items
  const grouped = TYPE_ORDER.reduce(
    (acc, type) => {
      acc[type] = items.filter((i) => i.type === type);
      return acc;
    },
    {} as Record<SceneItem["type"], SceneItem[]>,
  );

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
          <p
            className="font-mono-sys text-[9px] tracking-[0.4em] text-[#e2c9a0]/25 mb-6 uppercase"
          >
            {scene.district}
          </p>
          <h1
            className="text-xl tracking-widest mb-8"
            style={{
              fontFamily: "var(--font-noto-serif-tc), serif",
              color:      palette.accent,
            }}
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
          {overheardConvos.length > 0 && (
            <button
              onClick={() => setShowOverheard(true)}
              className="font-mono-sys text-[9px] px-2.5 py-1 rounded border border-[#e2c9a0]/12 text-[#e2c9a0]/30 hover:border-[#e2c9a0]/25 hover:text-[#e2c9a0]/55 transition-colors tracking-widest"
            >
              觀察
            </button>
          )}
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
            style={{
              fontFamily: "var(--font-noto-serif-tc), serif",
              color:      palette.accent,
            }}
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

        {/* Explored progress */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-[#e2c9a0]/06 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width:      `${(interactedItems.size / Math.max(items.length, 1)) * 100}%`,
                background: palette.accent,
                opacity:    0.4,
              }}
            />
          </div>
          <span className="font-mono-sys text-[9px] tracking-widest shrink-0" style={{ color: `${palette.accent}60` }}>
            {interactedItems.size}/{items.length}
          </span>
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
                </div>

                {/* Item cards */}
                <div className="space-y-2">
                  {group.map((item) => {
                    const interacted = interactedItems.has(item.id);
                    const npcColor   = item.npcId ? (NPC_COLORS[item.npcId] ?? DEFAULT_NPC_COLOR) : null;
                    const cardAccent = type === "npc" && npcColor
                      ? npcColor.dot
                      : accent;

                    return (
                      <button
                        id={`item-${item.id}`}
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="w-full text-left px-4 py-3 rounded border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center gap-3"
                        style={{
                          borderColor: highlightedItem === item.id
                            ? `${cardAccent}70`
                            : interacted
                            ? `${cardAccent}20`
                            : `${cardAccent}30`,
                          background: highlightedItem === item.id
                            ? `${cardAccent}14`
                            : interacted
                            ? "rgba(13,17,23,0.5)"
                            : "rgba(13,17,23,0.8)",
                          opacity: interacted && item.oneTimeOnly ? 0.45 : 1,
                          boxShadow: highlightedItem === item.id
                            ? `0 0 12px ${cardAccent}30`
                            : undefined,
                        }}
                      >
                        {/* Icon */}
                        <span className="text-lg leading-none shrink-0" style={{ opacity: interacted ? 0.5 : 1 }}>
                          {item.icon}
                        </span>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              className="text-sm leading-snug truncate"
                              style={{
                                fontFamily: "var(--font-noto-serif-tc), serif",
                                color:      interacted
                                  ? "rgba(226,201,160,0.35)"
                                  : "rgba(226,201,160,0.80)",
                              }}
                            >
                              {item.name}
                            </p>
                            {interacted && (
                              <span className="text-[10px] shrink-0" style={{ color: `${cardAccent}70` }}>
                                ✓
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
                        {/* NPC 時段限制 */}
                        {item.type === "npc" && item.npcId && !getNpcAvailability(sessionId, item.npcId) < 0.5 && (
                          <span className="font-mono-sys text-[7px] px-1.5 py-0.5 rounded-sm border shrink-0 tracking-wide border-[#ff3864]/25 text-[#ff3864]/60 bg-[#ff3864]/05">
                            {getTimePeriod(currentPeriod).label}不在
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Random NPC section — 路人 */}
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
                  style={{
                    borderColor: "rgba(226,201,160,0.10)",
                    background:  "rgba(13,17,23,0.6)",
                  }}
                >
                  <span className="text-lg leading-none shrink-0 opacity-60">{rNpc.icon}</span>
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
              <span className="text-2xl leading-none">{activeItem.icon}</span>
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
                style={{
                  borderColor: `${palette.accent}30`,
                  background:  `${palette.accent}08`,
                }}
              >
                <span className="text-sm" style={{ color: palette.accent }}>✓</span>
                <p
                  className="text-sm text-[#e2c9a0]/60"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  {getSuccessMessage(activeItem)}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
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
                {/* 使用道具按鈕 */}
                {activeItem.type !== "npc" && (
                  <button
                    onClick={() => {
                      const result = findItemCombination(activeItem.id, "");
                      if (result) setComboResult(result);
                      else setShowItemUse(true);
                    }}
                    className="w-full py-2.5 rounded border font-mono-sys text-[10px] tracking-widest transition-all border-[#f59e0b]/25 text-[#f59e0b]/55 hover:bg-[#f59e0b]/08"
                  >
                    使用道具
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* 偷聽對話 Bottom Sheet */}
      {showOverheard && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowOverheard(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 max-w-xl mx-auto rounded-t-2xl px-5 pt-5 pb-8 max-h-[70vh] flex flex-col"
            style={{ background: "#111827", borderTop: `1px solid ${palette.accent}20` }}
          >
            <div className="w-10 h-1 rounded-full bg-[#e2c9a0]/15 mx-auto mb-4 shrink-0" />
            <div className="flex items-center justify-between shrink-0 mb-4">
              <p className="font-mono-sys text-[10px] text-[#e2c9a0]/40 tracking-[0.3em] uppercase">
                觀察 — 旁聽
              </p>
              <button
                onClick={() => setShowOverheard(false)}
                className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/55"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              {overheardConvos.map((convo: NpcConversation) => (
                <div key={convo.id} className="space-y-2">
                  <p
                    className="font-mono-sys text-[9px] tracking-[0.3em] mb-2"
                    style={{ color: `${palette.accent}70` }}
                  >
                    {convo.topic}
                  </p>
                  {convo.snippet.map((line, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span
                        className="font-mono-sys text-[9px] shrink-0 mt-0.5 w-16 truncate"
                        style={{ color: "rgba(226,201,160,0.35)" }}
                      >
                        {line.speaker}
                      </span>
                      <p
                        className="text-xs text-[#e2c9a0]/60 leading-relaxed flex-1"
                        style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                      >
                        {line.line}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* C5: 新手引導 */}
      <TutorialOverlay kind="scene" />
    </div>
  );
}
