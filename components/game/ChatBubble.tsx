/**
 * ChatBubble — 對話氣泡元件（NPC 或玩家）
 * 接收已解析好的顯示內容，不含打字機邏輯（由 useChat hook 負責）。
 */

import type { NpcColorConfig } from "@/lib/types";

interface ChatBubbleProps {
  role:        "user" | "npc";
  /** 要顯示的文字（打字機截斷後的片段，或完整內容）*/
  displayText: string;
  createdAt:   Date;
  isTyping?:   boolean;
  isNew?:      boolean;
  npcColor:    NpcColorConfig;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });
}

/**
 * 單則對話氣泡。
 *
 * @example
 * <ChatBubble
 *   role="npc"
 *   displayText={getDisplayContent(msg)}
 *   createdAt={msg.createdAt}
 *   isTyping={msg.isTyping}
 *   isNew={msg.isNew}
 *   npcColor={npcColor}
 * />
 */
export function ChatBubble({
  role,
  displayText,
  createdAt,
  isTyping,
  isNew,
  npcColor,
}: ChatBubbleProps) {
  const isNpc     = role === "npc";
  const fadeClass = isNew !== false ? "animate-fade-in" : "";

  return (
    <div
      className={`flex ${isNpc ? "justify-start" : "justify-end"} ${fadeClass}`}
    >
      {isNpc ? (
        <div className="flex items-start gap-2.5 max-w-[80%]">
          {/* NPC 頭像點 */}
          <div className="shrink-0 mt-3">
            <div
              className="w-2 h-2 rounded-full mt-0.5"
              style={{
                background: npcColor.dot,
                boxShadow:  `0 0 5px ${npcColor.dot}80`,
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <div
              className="px-4 py-3 rounded-r-lg rounded-bl-lg text-sm leading-[1.9] whitespace-pre-wrap border"
              style={{
                fontFamily:  "var(--font-noto-serif-tc), serif",
                color:       "#e2c9a0cc",
                background:  npcColor.bubble,
                borderColor: npcColor.border,
              }}
            >
              {displayText}
              {isTyping && <span className="typing-cursor" />}
            </div>
            <span className="font-mono-sys text-[9px] text-[#e2c9a0]/18 pl-1">
              {formatTime(createdAt)}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1 items-end max-w-[75%]">
          <div
            className="px-4 py-3 rounded-l-lg rounded-br-lg text-sm leading-[1.9] whitespace-pre-wrap border"
            style={{
              fontFamily:  "var(--font-noto-serif-tc), serif",
              color:       "#e2c9a0cc",
              background:  "rgba(255,56,100,0.06)",
              borderColor: "rgba(255,56,100,0.22)",
            }}
          >
            {displayText}
          </div>
          <span className="font-mono-sys text-[9px] text-[#e2c9a0]/18 pr-1">
            {formatTime(createdAt)}
          </span>
        </div>
      )}
    </div>
  );
}
