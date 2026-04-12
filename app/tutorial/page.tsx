"use client";

import { useState } from "react";
import Link from "next/link";

interface TutorialStep {
  id:          number;
  title:       string;
  subtitle?:   string;
  icon:        string;
  content:     string[];
  tip?:        string;
}

const STEPS: TutorialStep[] = [
  {
    id:       1,
    title:    "歡迎來到賽德里斯",
    subtitle: "一座霧中城市的謀殺案",
    icon:     "🌆",
    content: [
      "你是一名調查員，剛剛接手了一起複雜的謀殺案。",
      "城市裡有九個可能的嫌疑人，每個人都有動機，每個人都有自己的祕密——但只有一個人是兇手。",
      "你的任務是在行動點耗盡之前，找到足夠的證據，指出真正的兇手與動機。",
    ],
    tip: "這不是一個有標準答案的故事。不同的遊戲，兇手和動機都可能不同。",
  },
  {
    id:       2,
    title:    "調查中心（Hub）",
    subtitle: "你的行動基地",
    icon:     "🗺️",
    content: [
      "調查中心是你的主頁面，從這裡可以前往城市裡的各個場景。",
      "每個場景卡片顯示場景名稱、可接觸的 NPC，以及你已探索的程度。",
      "右上角的「指控」按鈕在你蒐集到足夠線索後才建議使用——提交前請再確認一次。",
    ],
    tip: "行動點（AP）在頂部顯示。進入場景、發起對話都會消耗 AP，請謹慎規劃。",
  },
  {
    id:       3,
    title:    "場景探索",
    subtitle: "每個地點都有故事",
    icon:     "🔍",
    content: [
      "進入場景後，你可以與場景中的物件互動，觸發旁白或獲得線索。",
      "部分物件需要特定條件才會解鎖——例如你必須先和某個 NPC 對話，才能找到某樣東西。",
      "場景右上角的對話記錄按鈕可以瀏覽你在這個場景說過的話。",
    ],
    tip: "每個場景都有「偷聽」的機會。有時候什麼都不說，只是在旁邊等，反而能聽到最重要的事。",
  },
  {
    id:       4,
    title:    "與 NPC 對話",
    subtitle: "信任與謊言之間",
    icon:     "💬",
    content: [
      "點擊場景中的 NPC 卡片即可開始對話。每次對話消耗 1 行動點。",
      "每個 NPC 都有「信任度」。信任度越高，他們願意透露的秘密越多。",
      "直接問敏感問題可能會降低信任度。先從輕鬆的話題開始，慢慢建立關係。",
      "在困難模式下，兇手 NPC 可能會主動說謊。學會交叉比對不同人說的話。",
    ],
    tip: "同一個 NPC 多次對話，往往能挖出不同的線索——但每次對話都有成本。",
  },
  {
    id:       5,
    title:    "線索與道具",
    subtitle: "串起真相的碎片",
    icon:     "🧩",
    content: [
      "發現線索時，它會自動存入你的線索欄。線索分為：關係、動機、手法、不在場、一般五類。",
      "道具欄裡的物件可以兩兩組合，產生新的推論線索。",
      "組合成功會顯示推理過程，失敗時只是說這兩樣東西沒有關聯。",
      "推理筆記本（筆記）讓你記下自己的想法——這些內容只有你自己看得到。",
    ],
    tip: "不是所有線索都和兇手有關。有些線索只是讓你更了解這座城市——但它們可能是排除嫌疑人的關鍵。",
  },
  {
    id:       6,
    title:    "幕次推進",
    subtitle: "時間不會等人",
    icon:     "⏳",
    content: [
      "調查分為三幕。隨著幕次推進，NPC 的行為和可用的線索都會改變。",
      "第二幕後，某些原本封閉的場景會開放，某些 NPC 會願意透露更多。",
      "但也有一些線索只在早期幕次才能取得——錯過就沒有了。",
    ],
    tip: "如果你在一個場景或 NPC 身上花了太多時間，嘗試換個方向——有時候繞一圈再回來，效果更好。",
  },
  {
    id:       7,
    title:    "最終指控",
    subtitle: "你只有一次機會",
    icon:     "⚖️",
    content: [
      "當你準備好了，前往指控頁面。選擇你認為的兇手（一個嫌疑人）和動機方向（A/B/C/D）。",
      "兇手和動機都答對，才算破案成功。只對一半，也算調查失敗。",
      "指控一旦提交就無法撤回。提交前，請再看一次你的線索和筆記。",
    ],
    tip: "動機方向分為 A（野心/利益）、B（仇恨/報復）、C（恐懼/自保）、D（信仰/執念）。注意 NPC 說話的方式，往往暗示了他們的動機。",
  },
  {
    id:       8,
    title:    "準備好了嗎？",
    subtitle: "賽德里斯等著你",
    icon:     "🌙",
    content: [
      "你可以選擇任意難度開始：劇情模式讓你專注在故事上，普通和困難需要更多推理，極難則沒有任何提示。",
      "第二相體身份解鎖 B 路線——一條更複雜、更黑暗的調查路線，你的判斷會逐漸受到「侵蝕」的影響。",
      "每一局遊戲都是獨立的。新遊戲開始時，兇手和動機會重新隨機分配。",
    ],
    tip: "如果你第一局沒有破案，試著換個身份或難度再來一次。不同的起始條件會讓你注意到不同的線索。",
  },
];

export default function TutorialPage() {
  const [step,     setStep]     = useState(0);
  const [animDir,  setAnimDir]  = useState<"next" | "prev" | null>(null);

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast  = step === STEPS.length - 1;

  const go = (dir: "next" | "prev") => {
    setAnimDir(dir);
    setTimeout(() => {
      setStep((s) => dir === "next" ? s + 1 : s - 1);
      setAnimDir(null);
    }, 120);
  };

  return (
    <div style={{
      minHeight:  "100dvh",
      background: "#0a0a0f",
      color:      "#e2c9a0",
      fontFamily: "'Noto Serif TC', Georgia, serif",
      display:    "flex",
      flexDirection: "column",
    }}>

      {/* 頂部 */}
      <div style={{ padding: "1rem 1.25rem 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ color: "rgba(226,201,160,0.4)", textDecoration: "none", fontSize: "0.78rem", letterSpacing: "0.08em" }}>
          ← 返回首頁
        </Link>
        <span style={{ fontSize: "0.72rem", color: "rgba(226,201,160,0.3)", letterSpacing: "0.08em" }}>
          {step + 1} / {STEPS.length}
        </span>
      </div>

      {/* 進度條 */}
      <div style={{ padding: "0.75rem 1.25rem 0" }}>
        <div style={{ height: "2px", background: "rgba(226,201,160,0.06)", borderRadius: "1px", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width:  `${((step + 1) / STEPS.length) * 100}%`,
              background: "rgba(226,201,160,0.35)",
              borderRadius: "1px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* 主要內容 */}
      <div
        style={{
          flex:        1,
          display:     "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding:     "2rem 1.5rem",
          maxWidth:    "36rem",
          margin:      "0 auto",
          width:       "100%",
          opacity:     animDir ? 0 : 1,
          transform:   animDir === "next" ? "translateX(-12px)" : animDir === "prev" ? "translateX(12px)" : "none",
          transition:  "opacity 0.12s, transform 0.12s",
        }}
      >
        {/* 圖示 */}
        <div style={{ fontSize: "3rem", marginBottom: "1.25rem", textAlign: "center" }}>
          {current.icon}
        </div>

        {/* 標題 */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, letterSpacing: "0.06em", margin: 0, color: "#e2c9a0" }}>
            {current.title}
          </h1>
          {current.subtitle && (
            <p style={{ fontSize: "0.78rem", color: "rgba(226,201,160,0.4)", marginTop: "0.3rem", letterSpacing: "0.06em" }}>
              {current.subtitle}
            </p>
          )}
        </div>

        {/* 說明文字 */}
        <div style={{
          background:   "rgba(226,201,160,0.025)",
          border:       "1px solid rgba(226,201,160,0.08)",
          borderRadius: "0.5rem",
          padding:      "1.25rem 1.25rem",
          marginBottom: "1rem",
        }}>
          {current.content.map((para, i) => (
            <p
              key={i}
              style={{
                fontSize:     "0.88rem",
                lineHeight:   1.75,
                color:        "rgba(226,201,160,0.8)",
                marginBottom: i < current.content.length - 1 ? "0.75rem" : 0,
                letterSpacing: "0.03em",
              }}
            >
              {para}
            </p>
          ))}
        </div>

        {/* 提示 */}
        {current.tip && (
          <div style={{
            background:   "rgba(91,184,255,0.04)",
            border:       "1px solid rgba(91,184,255,0.12)",
            borderRadius: "0.4rem",
            padding:      "0.75rem 1rem",
          }}>
            <div style={{ fontSize: "0.68rem", color: "rgba(91,184,255,0.5)", letterSpacing: "0.12em", marginBottom: "0.3rem" }}>
              提示
            </div>
            <p style={{ fontSize: "0.8rem", lineHeight: 1.65, color: "rgba(91,184,255,0.75)", margin: 0, letterSpacing: "0.03em" }}>
              {current.tip}
            </p>
          </div>
        )}
      </div>

      {/* 底部導航 */}
      <div style={{ padding: "1rem 1.5rem 2rem", maxWidth: "36rem", margin: "0 auto", width: "100%" }}>
        {isLast ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Link
              href="/game"
              style={{
                display:      "block",
                textAlign:    "center",
                padding:      "0.85rem",
                background:   "rgba(226,201,160,0.08)",
                border:       "1px solid rgba(226,201,160,0.2)",
                borderRadius: "0.4rem",
                color:        "#e2c9a0",
                textDecoration: "none",
                fontSize:     "0.88rem",
                letterSpacing: "0.08em",
              }}
            >
              開始調查 →
            </Link>
            <button
              onClick={() => go("prev")}
              style={{
                background:   "transparent",
                border:       "none",
                color:        "rgba(226,201,160,0.35)",
                fontSize:     "0.78rem",
                cursor:       "pointer",
                padding:      "0.5rem",
                letterSpacing: "0.05em",
              }}
            >
              ← 上一頁
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {!isFirst && (
              <button
                onClick={() => go("prev")}
                style={{
                  flex:         "0 0 auto",
                  padding:      "0.8rem 1.2rem",
                  background:   "transparent",
                  border:       "1px solid rgba(226,201,160,0.1)",
                  borderRadius: "0.4rem",
                  color:        "rgba(226,201,160,0.45)",
                  cursor:       "pointer",
                  fontSize:     "0.85rem",
                  letterSpacing: "0.05em",
                }}
              >
                ←
              </button>
            )}
            <button
              onClick={() => go("next")}
              style={{
                flex:         1,
                padding:      "0.8rem",
                background:   "rgba(226,201,160,0.06)",
                border:       "1px solid rgba(226,201,160,0.15)",
                borderRadius: "0.4rem",
                color:        "#e2c9a0",
                cursor:       "pointer",
                fontSize:     "0.88rem",
                letterSpacing: "0.08em",
              }}
            >
              下一頁 →
            </button>
          </div>
        )}

        {/* 跳過 */}
        {!isLast && (
          <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
            <Link
              href="/game"
              style={{
                fontSize:     "0.72rem",
                color:        "rgba(226,201,160,0.25)",
                textDecoration: "none",
                letterSpacing: "0.08em",
              }}
            >
              跳過教學，直接開始
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
