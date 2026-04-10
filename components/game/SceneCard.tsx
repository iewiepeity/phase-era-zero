/**
 * SceneCard — 場景選擇卡片
 * 地圖頁面（/game/[sessionId]）使用。
 */

import type { Scene } from "@/lib/scene-config";
import { SCENE_PALETTE, DEFAULT_SCENE_PALETTE } from "@/lib/constants";

interface SceneCardProps {
  scene:      Scene;
  index:      number;
  /** 點擊可進入的場景時的回呼 */
  onEnter:    (scene: Scene) => void;
}

/**
 * 單張場景卡片。locked 場景不可點擊，顯示鎖定原因。
 *
 * @example
 * <SceneCard
 *   scene={scene}
 *   index={idx}
 *   onEnter={(s) => router.push(`/game/${sessionId}/chat/${s.npcs[0].id}`)}
 * />
 */
export function SceneCard({ scene, index, onEnter }: SceneCardProps) {
  const pal      = SCENE_PALETTE[scene.id] ?? DEFAULT_SCENE_PALETTE;
  const canEnter = !scene.locked && scene.npcs.length > 0;

  return (
    <div
      onClick={() => canEnter && onEnter(scene)}
      className={`
        relative overflow-hidden rounded p-4 border
        transition-all duration-300
        animate-fade-in-up opacity-0
        ${canEnter ? "cursor-pointer card-lift" : "opacity-40 cursor-default"}
      `}
      style={{
        animationDelay:  `${index * 80}ms`,
        borderColor:     pal.border,
        backgroundColor: pal.glow,
      }}
      onMouseEnter={(e) => {
        if (!canEnter) return;
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = pal.borderHover;
        el.style.boxShadow   = `0 0 20px ${pal.glow}, 0 4px 24px rgba(0,0,0,0.4)`;
      }}
      onMouseLeave={(e) => {
        if (!canEnter) return;
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = pal.border;
        el.style.boxShadow   = "";
      }}
    >
      {/* 左側裝飾條 */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[2px]"
        style={{ background: `linear-gradient(180deg, ${pal.accent}80, transparent)` }}
      />

      {/* 頂部行：名稱 + 鎖定狀態 */}
      <div className="flex items-start justify-between mb-1 pl-2">
        <div>
          <p
            className="text-sm tracking-wider text-[#e2c9a0]"
            style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
          >
            {scene.name}
          </p>
          <p
            className="font-mono-sys text-[10px] tracking-widest mt-0.5"
            style={{ color: `${pal.accent}70` }}
          >
            {scene.district}
          </p>
        </div>

        {scene.locked ? (
          <span
            className="font-mono-sys text-[9px] px-2 py-0.5 rounded tracking-wide border"
            style={{
              color:       `${pal.accent}65`,
              borderColor: `${pal.accent}25`,
              background:  pal.badge,
            }}
          >
            {scene.lockReason ?? "LOCKED"}
          </span>
        ) : (
          <span
            className="font-mono-sys text-[10px] tracking-widest"
            style={{ color: `${pal.accent}70` }}
          >
            →
          </span>
        )}
      </div>

      {/* 描述 */}
      <p
        className="text-xs text-[#e2c9a0]/40 leading-relaxed my-2 pl-2"
        style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
      >
        {scene.description}
      </p>

      {/* 底部行：NPC + 氛圍 */}
      <div className="flex items-center justify-between mt-2 pl-2">
        <div className="flex gap-1.5">
          {scene.npcs.length > 0 ? (
            scene.npcs.map((npc) => (
              <span
                key={npc.id}
                className="text-[10px] px-2 py-0.5 rounded border"
                style={{
                  color:       `${pal.accent}80`,
                  borderColor: `${pal.accent}25`,
                  background:  pal.badge,
                  fontFamily:  "var(--font-noto-serif-tc), serif",
                }}
              >
                {npc.name}
              </span>
            ))
          ) : (
            <span className="font-mono-sys text-[10px] text-[#e2c9a0]/18">無人在場</span>
          )}
        </div>
        <span
          className="text-[10px] italic text-right max-w-[130px]"
          style={{
            color:      `${pal.accent}45`,
            fontFamily: "var(--font-noto-serif-tc), serif",
          }}
        >
          {scene.ambience}
        </span>
      </div>
    </div>
  );
}
