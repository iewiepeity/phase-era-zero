import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { generateCase } from "@/lib/random-engine";
import type { KillerId, MotiveDirection } from "@/lib/case-config";

// ── POST /api/game/new ────────────────────────────────────────
// 開新局：隨機生成案件配置，寫入 game_sessions，回傳 sessionId
// truthString 不對前端揭露
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      guestId?: string;
      seed?: number;
      forceKiller?: KillerId;
      forceMotive?: MotiveDirection;
    };

    const { guestId, seed, forceKiller, forceMotive } = body;

    // 1. 生成案件配置
    const config = generateCase({ seed, forceKiller, forceMotive });

    // 2. 寫入 Supabase（如果已設定）
    let sessionId: string | null = null;

    if (isSupabaseConfigured()) {
      const db = createServerSupabase();

      // 如果 guestId 有活躍的舊 session，先標記結束
      if (guestId) {
        await db
          .from("game_sessions")
          .update({ status: "abandoned" })
          .eq("player_name", guestId)
          .eq("status", "active");
      }

      const { data, error } = await db
        .from("game_sessions")
        .insert({
          player_name: guestId ?? "anonymous",
          killer_id: config.killerId,
          motive_direction: config.motiveDirection,
          status: "active",
        })
        .select("id")
        .single();

      if (error) {
        console.error("[POST /api/game/new] insert session:", error.message);
        return NextResponse.json(
          { error: "server_error", message: "無法建立新局。" },
          { status: 500 }
        );
      }

      sessionId = data.id;
    }

    // 3. 若沒有 DB，用本地 ID 讓 UI 仍可導航（無法持久化）
    if (!sessionId) {
      sessionId = `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    }

    // 4. 回傳（不含 truthString / 兇手身份）
    return NextResponse.json({
      sessionId,
      motiveCount: 4,           // 供 UI 顯示「4 個動機方向待解」
      suspectCount: 8,           // 供 UI 顯示「8 名嫌疑人」
      seed: config.seed,         // 開發/除錯用，prod 可移除
      generatedAt: config.generatedAt,
    });
  } catch (err) {
    console.error("[POST /api/game/new]", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: "server_error", message: msg }, { status: 500 });
  }
}
