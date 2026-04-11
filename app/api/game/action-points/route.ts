/**
 * PATCH /api/game/action-points
 * Body: { sessionId: string; actionPoints: number }
 *
 * 同步行動點到 game_sessions.action_points。
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as {
      sessionId:     string;
      actionPoints?: number; // 絕對值（直接設定）
      delta?:        number; // 相對值（正數增加，負數扣除）
    };

    const { sessionId, actionPoints, delta } = body;

    if (!sessionId || (typeof actionPoints !== "number" && typeof delta !== "number")) {
      return NextResponse.json({ error: "invalid_params", message: "需要提供 actionPoints 或 delta" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: true, offline: true });
    }

    const db = createServerSupabase();

    // 若使用 delta（相對值），先讀取目前值再計算
    if (typeof delta === "number" && typeof actionPoints !== "number") {
      const { data } = await db
        .from("game_sessions")
        .select("action_points")
        .eq("id", sessionId)
        .maybeSingle();
      const current   = (data as { action_points?: number } | null)?.action_points ?? 30;
      const newPoints = Math.max(0, current + delta);
      await db
        .from("game_sessions")
        .update({ action_points: newPoints })
        .eq("id", sessionId);
      return NextResponse.json({ ok: true, actionPoints: newPoints });
    }

    // actionPoints 絕對值
    await db
      .from("game_sessions")
      .update({ action_points: actionPoints })
      .eq("id", sessionId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[action-points] PATCH:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
