"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { STORAGE_KEYS } from "@/lib/constants";
import { getActionPoints, getMaxActionPoints } from "@/lib/services/action-points";
import { getDifficulty, type DifficultyId } from "@/lib/content/difficulty";
import { SCENES } from "@/lib/scene-config";

interface Stats {
  // 遊戲進度
  currentAct:       number;
  identity:         "normal" | "phase2";
  difficulty:       DifficultyId;
  evValue:          number;
  // 行動點
  actionPoints:     number;
  maxActionPoints:  number;
  apUsed:           number;
  // 探索
  visitedSceneCount: number;
  totalSceneCount:   number;
  visitedScenes:     string[];
  // 線索
  clueCount:        number;
  // 成就
  achievementCount: number;
  // 對話
  chatCount:        number;
  // 偷聽
  eavesdropCount:   number;
  // 存檔時間
  lastSaved:        number | null;
}

const SCENE_NAMES: Record<string, string> = {
  chen_jie_noodles:    "陳姐麵館",
  crime_scene:         "犯罪現場",
  foggy_port:          "霧港碼頭",
  ninth_precinct:      "第九分局",
  bai_qiu_pharmacy:    "白秋藥局",
  medical_center:      "醫療中心",
  lin_lab:             "林知夏實驗室",
  btma_lobby:          "BTMA 大廳",
  abandoned_warehouse: "廢棄倉庫",
  zhengbo_office:      "鄭博辦公室",
};

const ACT_LABELS = ["序章", "第一幕", "第二幕", "第三幕"];

export default function StatsPage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;

  const [stats,     setStats]     = useState<Stats | null>(null);
  const [mounted,   setMounted]   = useState(false);

  useEffect(() => {
    const get    = (key: string) => localStorage.getItem(key) ?? "";
    const getInt = (key: string, def: number) =>
      parseInt(localStorage.getItem(key) ?? String(def), 10) || def;

    const identity   = (get(STORAGE_KEYS.IDENTITY(sessionId)) || "normal") as "normal" | "phase2";
    const difficulty = (get(STORAGE_KEYS.DIFFICULTY(sessionId)) || "normal") as DifficultyId;
    const currentAct = getInt(`pez_act_${sessionId}`, 1);
    const evValue    = getInt(`pez_ev_${sessionId}`, 0);
    const ap         = getActionPoints(sessionId);
    const maxAp      = getMaxActionPoints(sessionId);

    const visitedRaw    = get(STORAGE_KEYS.VISITED_SCENES(sessionId));
    const visitedScenes = visitedRaw ? visitedRaw.split(",").filter(Boolean) : [];

    const achievementsRaw = get(STORAGE_KEYS.ACHIEVEMENTS);
    const achievements    = achievementsRaw ? achievementsRaw.split(",").filter(Boolean) : [];

    const eavesdropRaw = get(`pez_eavesdrop_${sessionId}`);
    const eavesdrop    = eavesdropRaw ? eavesdropRaw.split(",").filter(Boolean) : [];

    // 從 localStorage save 讀取存檔時間
    const saveRaw  = localStorage.getItem(`pez_save_${sessionId}`);
    let lastSaved: number | null = null;
    if (saveRaw) {
      try {
        const parsed = JSON.parse(saveRaw) as { savedAt?: number };
        lastSaved = parsed.savedAt ?? null;
      } catch { /* ignore */ }
    }

    setStats({
      currentAct,
      identity,
      difficulty,
      evValue,
      actionPoints:      ap < 0 ? maxAp : ap,
      maxActionPoints:   maxAp,
      apUsed:            ap < 0 ? 0 : maxAp - ap,
      visitedSceneCount: visitedScenes.length,
      totalSceneCount:   SCENES.length,
      visitedScenes,
      clueCount:         0, // 從 API 非同步載入
      achievementCount:  achievements.length,
      chatCount:         0, // 從 API 非同步載入
      eavesdropCount:    eavesdrop.length,
      lastSaved,
    });
    setMounted(true);
  }, [sessionId]);

  // 從 API 載入線索數量和對話數量
  useEffect(() => {
    if (!mounted) return;
    const fetchCounts = async () => {
      try {
        const [clueRes, chatRes] = await Promise.all([
          fetch(`/api/game/clues?sessionId=${encodeURIComponent(sessionId)}`),
          fetch(`/api/game/chat-log?sessionId=${encodeURIComponent(sessionId)}`),
        ]);
        const clueData = clueRes.ok ? await clueRes.json() as { clues: unknown[] } : null;
        const chatData = chatRes.ok ? await chatRes.json() as { messages: unknown[] } : null;

        setStats((prev) => prev ? {
          ...prev,
          clueCount:  clueData?.clues?.length ?? prev.clueCount,
          chatCount:  chatData?.messages?.length ?? prev.chatCount,
        } : prev);
      } catch { /* silently ignore */ }
    };
    fetchCounts();
  }, [sessionId, mounted]);

  if (!mounted || !stats) {
    return (
      <div style={{ minHeight: "100dvh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(226,201,160,0.35)", fontSize: "0.85rem", letterSpacing: "0.1em" }}>載入中…</div>
      </div>
    );
  }

  const diff = getDifficulty(stats.difficulty);
  const apPct = stats.maxActionPoints > 0 ? (stats.actionPoints / stats.maxActionPoints) * 100 : 0;

  return (
    <div style={{ minHeight: "100dvh", background: "#0a0a0f", color: "#e2c9a0", fontFamily: "'Noto Serif TC', Georgia, serif" }}>

      {/* 頂部導覽 */}
      <div style={{ padding: "1rem 1.25rem 0", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Link
          href={`/game/${sessionId}`}
          style={{ color: "rgba(226,201,160,0.45)", textDecoration: "none", fontSize: "0.8rem", letterSpacing: "0.08em" }}
        >
          ← 返回
        </Link>
        <span style={{ color: "rgba(226,201,160,0.2)", fontSize: "0.75rem" }}>|</span>
        <span style={{ color: "rgba(226,201,160,0.5)", fontSize: "0.8rem", letterSpacing: "0.1em" }}>調查統計</span>
      </div>

      <div style={{ padding: "1.5rem 1.25rem 4rem", maxWidth: "42rem", margin: "0 auto" }}>

        {/* 標題 */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 600, letterSpacing: "0.08em", color: "#e2c9a0", margin: 0 }}>
            調查紀錄
          </h1>
          <p style={{ fontSize: "0.75rem", color: "rgba(226,201,160,0.4)", marginTop: "0.25rem", letterSpacing: "0.05em" }}>
            {stats.lastSaved
              ? `上次存檔：${new Date(stats.lastSaved).toLocaleString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
              : "尚無存檔記錄"
            }
          </p>
        </div>

        {/* 遊戲狀態卡片 */}
        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "0.75rem", color: "rgba(226,201,160,0.4)", letterSpacing: "0.15em", marginBottom: "0.75rem", textTransform: "uppercase" }}>
            目前狀態
          </h2>
          <div style={{
            background: "rgba(226,201,160,0.03)",
            border: "1px solid rgba(226,201,160,0.08)",
            borderRadius: "0.5rem",
            padding: "1rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}>
            <StatRow label="調查進度" value={ACT_LABELS[stats.currentAct] ?? `第 ${stats.currentAct} 幕`} />
            <StatRow label="難度" value={diff.name} valueColor={diff.accentColor} />
            <StatRow
              label="身份"
              value={stats.identity === "phase2" ? "第二相體" : "一般調查員"}
              valueColor={stats.identity === "phase2" ? "#c084fc" : undefined}
            />
            {stats.identity === "phase2" && (
              <StatRow label="侵蝕值" value={`${stats.evValue} / 100`} valueColor={stats.evValue > 60 ? "#ff3864" : undefined} />
            )}
          </div>
        </section>

        {/* 行動點 */}
        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "0.75rem", color: "rgba(226,201,160,0.4)", letterSpacing: "0.15em", marginBottom: "0.75rem", textTransform: "uppercase" }}>
            行動點
          </h2>
          <div style={{
            background: "rgba(226,201,160,0.03)",
            border: "1px solid rgba(226,201,160,0.08)",
            borderRadius: "0.5rem",
            padding: "1rem",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", color: "rgba(226,201,160,0.55)" }}>剩餘行動點</span>
              <span style={{ fontSize: "0.9rem", fontVariantNumeric: "tabular-nums" }}>
                {stats.actionPoints} <span style={{ color: "rgba(226,201,160,0.35)" }}>/ {stats.maxActionPoints}</span>
              </span>
            </div>
            <div style={{ height: "4px", background: "rgba(226,201,160,0.08)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${apPct}%`, background: apPct > 30 ? "#4ade80" : "#f59e0b", borderRadius: "2px", transition: "width 0.3s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: "rgba(226,201,160,0.35)" }}>
                已使用 {stats.apUsed} 點
              </span>
              <span style={{ fontSize: "0.75rem", color: "rgba(226,201,160,0.35)" }}>
                消耗率 {stats.maxActionPoints > 0 ? Math.round((stats.apUsed / stats.maxActionPoints) * 100) : 0}%
              </span>
            </div>
          </div>
        </section>

        {/* 探索進度 */}
        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "0.75rem", color: "rgba(226,201,160,0.4)", letterSpacing: "0.15em", marginBottom: "0.75rem", textTransform: "uppercase" }}>
            場景探索
          </h2>
          <div style={{
            background: "rgba(226,201,160,0.03)",
            border: "1px solid rgba(226,201,160,0.08)",
            borderRadius: "0.5rem",
            padding: "1rem",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.8rem", color: "rgba(226,201,160,0.55)" }}>已訪問場景</span>
              <span style={{ fontSize: "0.9rem", fontVariantNumeric: "tabular-nums" }}>
                {stats.visitedSceneCount}
                <span style={{ color: "rgba(226,201,160,0.35)" }}> / {stats.totalSceneCount}</span>
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
              {SCENES.map((scene) => {
                const visited = stats.visitedScenes.includes(scene.id);
                return (
                  <span
                    key={scene.id}
                    style={{
                      fontSize: "0.72rem",
                      padding: "0.2rem 0.55rem",
                      borderRadius: "99px",
                      border: visited
                        ? "1px solid rgba(74,222,128,0.3)"
                        : "1px solid rgba(226,201,160,0.08)",
                      color: visited
                        ? "rgba(74,222,128,0.8)"
                        : "rgba(226,201,160,0.25)",
                      background: visited
                        ? "rgba(74,222,128,0.06)"
                        : "transparent",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {SCENE_NAMES[scene.id] ?? scene.id}
                  </span>
                );
              })}
            </div>
          </div>
        </section>

        {/* 調查數據 */}
        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "0.75rem", color: "rgba(226,201,160,0.4)", letterSpacing: "0.15em", marginBottom: "0.75rem", textTransform: "uppercase" }}>
            調查數據
          </h2>
          <div style={{
            background: "rgba(226,201,160,0.03)",
            border: "1px solid rgba(226,201,160,0.08)",
            borderRadius: "0.5rem",
            padding: "1rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
          }}>
            <BigStat label="蒐集線索" value={stats.clueCount} unit="條" />
            <BigStat label="對話紀錄" value={stats.chatCount} unit="則" />
            <BigStat label="成就解鎖" value={stats.achievementCount} unit="個" />
            <BigStat label="偷聽次數" value={stats.eavesdropCount} unit="次" />
          </div>
        </section>

        {/* 快速導航 */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {[
            { href: `/game/${sessionId}/clues`,     label: "線索" },
            { href: `/game/${sessionId}/inventory`,  label: "道具" },
            { href: `/game/${sessionId}/notebook`,   label: "筆記" },
            { href: `/game/${sessionId}/achievements`, label: "成就" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                fontSize: "0.78rem",
                padding: "0.4rem 0.85rem",
                border: "1px solid rgba(226,201,160,0.12)",
                borderRadius: "0.35rem",
                color: "rgba(226,201,160,0.55)",
                textDecoration: "none",
                background: "rgba(226,201,160,0.02)",
                letterSpacing: "0.06em",
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 子元件 ────────────────────────────────────────────────────

function StatRow({
  label,
  value,
  valueColor,
}: {
  label:       string;
  value:       string;
  valueColor?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: "0.72rem", color: "rgba(226,201,160,0.4)", marginBottom: "0.15rem", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ fontSize: "0.88rem", color: valueColor ?? "rgba(226,201,160,0.85)", letterSpacing: "0.03em" }}>
        {value}
      </div>
    </div>
  );
}

function BigStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit:  string;
}) {
  return (
    <div style={{
      padding: "0.65rem 0.75rem",
      background: "rgba(226,201,160,0.02)",
      border: "1px solid rgba(226,201,160,0.06)",
      borderRadius: "0.35rem",
      textAlign: "center",
    }}>
      <div style={{ fontSize: "1.6rem", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "#e2c9a0", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: "0.68rem", color: "rgba(226,201,160,0.35)", marginTop: "0.2rem", letterSpacing: "0.08em" }}>
        {label}（{unit}）
      </div>
    </div>
  );
}
