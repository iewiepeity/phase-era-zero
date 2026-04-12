"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { STORAGE_KEYS } from "@/lib/constants";
import { SCENES } from "@/lib/scene-config";
import { getActionPoints, getMaxActionPoints } from "@/lib/services/action-points";
import { getCurrentPeriod, getPeriodName } from "@/lib/services/time-system";
import { getTriggeredCount } from "@/lib/services/event-system";
import { NPC_REGISTRY } from "@/lib/npc-registry";

interface NpcTrustEntry {
  npcId:   string;
  name:    string;
  trust:   number;
}

export default function StatsPage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;

  const [ready,          setReady]          = useState(false);
  const [cluesCount,     setCluesCount]     = useState(0);
  const [visitedScenes,  setVisitedScenes]  = useState<string[]>([]);
  const [ap,             setAp]             = useState(0);
  const [maxAp,          setMaxAp]          = useState(30);
  const [apUsed,         setApUsed]         = useState(0);
  const [period,         setPeriod]         = useState("早晨");
  const [eventCount,     setEventCount]     = useState(0);
  const [npcList,        setNpcList]        = useState<NpcTrustEntry[]>([]);

  useEffect(() => {
    // AP
    const currentAp = getActionPoints(sessionId);
    const maxApVal  = getMaxActionPoints(sessionId);
    setAp(currentAp < 0 ? 0 : currentAp);
    setMaxAp(maxApVal);
    setApUsed(currentAp < 0 ? 0 : maxApVal - currentAp);

    // 時段
    const p = getCurrentPeriod(sessionId);
    setPeriod(getPeriodName(p));

    // 事件數量
    setEventCount(getTriggeredCount(sessionId));

    // 訪問場景
    const visitedKey = STORAGE_KEYS.VISITED_SCENES(sessionId);
    const visitedRaw = localStorage.getItem(visitedKey) ?? "";
    const visitedIds = visitedRaw.split(",").filter(Boolean);
    setVisitedScenes(visitedIds);

    // 已對話 NPC（從 localStorage 抓信任度）
    const entries: NpcTrustEntry[] = [];
    for (const npc of Object.values(NPC_REGISTRY)) {
      const trustKey = `pez_trust_${sessionId}_${npc.id}`;
      const raw      = localStorage.getItem(trustKey);
      if (raw !== null) {
        entries.push({ npcId: npc.id, name: npc.name, trust: parseInt(raw, 10) || 0 });
      }
    }
    setNpcList(entries.sort((a, b) => b.trust - a.trust));

    // 線索數量（從 DB 或 localStorage）
    fetch(`/api/game/clues?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((d: { clues?: unknown[] }) => setCluesCount(d.clues?.length ?? 0))
      .catch(() => setCluesCount(0));

    setReady(true);
  }, [sessionId]);

  const sceneMap: Record<string, string> = {};
  for (const s of SCENES) sceneMap[s.id] = s.name;

  const apPercent = maxAp > 0 ? Math.round((apUsed / maxAp) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117]">
      <div className="fixed inset-0 bg-grid-static opacity-30 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex-1 max-w-xl mx-auto w-full px-5 pt-10 pb-16">

        {/* 導覽 */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href={`/game/${sessionId}`}
            className="font-mono-sys text-[10px] text-[#e2c9a0]/25 hover:text-[#e2c9a0]/55 tracking-widest transition-colors"
          >
            ← 返回
          </Link>
          <p className="font-mono-sys text-[9px] text-[#5bb8ff]/25 tracking-widest">STATS</p>
        </div>

        {/* 標題 */}
        <div className="mb-8">
          <h1
            className="text-lg tracking-widest text-[#e2c9a0]/85"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            調查統計
          </h1>
          <p
            className="text-xs text-[#e2c9a0]/30 mt-1"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            本局進度一覽
          </p>
        </div>

        {!ready ? (
          <p className="font-mono-sys text-[10px] text-[#e2c9a0]/20 tracking-widest animate-pulse text-center py-12">
            LOADING…
          </p>
        ) : (
          <div className="space-y-6">

            {/* AP 消耗 */}
            <section className="p-4 rounded border border-[#5bb8ff]/12 bg-[#5bb8ff]/02">
              <p className="font-mono-sys text-[9px] text-[#5bb8ff]/40 tracking-[0.4em] mb-3 uppercase">行動點</p>
              <div className="flex items-end gap-3 mb-2">
                <span className="font-mono-sys text-2xl text-[#e2c9a0]/70">{apUsed}</span>
                <span className="font-mono-sys text-sm text-[#e2c9a0]/25 mb-0.5">/ {maxAp} 已使用</span>
                <span className="font-mono-sys text-[10px] text-[#5bb8ff]/50 mb-0.5 ml-auto">{ap} 剩餘</span>
              </div>
              <div className="w-full h-1.5 bg-[#e2c9a0]/06 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width:      `${apPercent}%`,
                    background: apPercent > 80 ? "#ff3864" : apPercent > 50 ? "#f59e0b" : "#5bb8ff",
                  }}
                />
              </div>
            </section>

            {/* 時段 + 事件 */}
            <div className="grid grid-cols-2 gap-3">
              <section className="p-4 rounded border border-[#e2c9a0]/08 bg-[#e2c9a0]/01">
                <p className="font-mono-sys text-[9px] text-[#e2c9a0]/25 tracking-[0.4em] mb-2 uppercase">當前時段</p>
                <p
                  className="text-base text-[#e2c9a0]/70"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  {period}
                </p>
              </section>
              <section className="p-4 rounded border border-[#e2c9a0]/08 bg-[#e2c9a0]/01">
                <p className="font-mono-sys text-[9px] text-[#e2c9a0]/25 tracking-[0.4em] mb-2 uppercase">隨機事件</p>
                <p className="font-mono-sys text-2xl text-[#e2c9a0]/70">{eventCount}</p>
              </section>
            </div>

            {/* 線索 */}
            <section className="p-4 rounded border border-[#ff3864]/12 bg-[#ff3864]/02">
              <p className="font-mono-sys text-[9px] text-[#ff3864]/40 tracking-[0.4em] mb-2 uppercase">已發現線索</p>
              <p className="font-mono-sys text-3xl text-[#e2c9a0]/70">{cluesCount}</p>
            </section>

            {/* 訪問場景 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <p className="font-mono-sys text-[9px] text-[#4ade80]/40 tracking-[0.4em] uppercase">已探索場景</p>
                <span className="font-mono-sys text-[9px] text-[#4ade80]/60 ml-auto">{visitedScenes.length} / {SCENES.length}</span>
              </div>
              {visitedScenes.length === 0 ? (
                <p
                  className="text-xs text-[#e2c9a0]/20"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  尚未探索任何場景。
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {visitedScenes.map((id) => (
                    <span
                      key={id}
                      className="font-mono-sys text-[9px] px-2 py-1 rounded-sm border border-[#4ade80]/20 text-[#4ade80]/55 bg-[#4ade80]/03"
                    >
                      {sceneMap[id] ?? id}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* NPC 信任度 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <p className="font-mono-sys text-[9px] text-[#c084fc]/40 tracking-[0.4em] uppercase">已對話 NPC</p>
                <span className="font-mono-sys text-[9px] text-[#c084fc]/60 ml-auto">{npcList.length} 位</span>
              </div>
              {npcList.length === 0 ? (
                <p
                  className="text-xs text-[#e2c9a0]/20"
                  style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                >
                  還沒和任何人說過話。
                </p>
              ) : (
                <div className="space-y-2">
                  {npcList.map((n) => (
                    <div
                      key={n.npcId}
                      className="flex items-center gap-3 px-3 py-2 rounded border border-[#e2c9a0]/06 bg-[#e2c9a0]/01"
                    >
                      <p
                        className="text-sm text-[#e2c9a0]/60 flex-1"
                        style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
                      >
                        {n.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1 bg-[#e2c9a0]/08 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width:      `${Math.min(n.trust, 100)}%`,
                              background: n.trust >= 70 ? "#4ade80" : n.trust >= 40 ? "#f59e0b" : "#c084fc",
                            }}
                          />
                        </div>
                        <span className="font-mono-sys text-[9px] text-[#e2c9a0]/30 w-6 text-right">
                          {n.trust}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        )}
      </div>
    </div>
  );
}
