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
    const { sessionId, actionPoints } = await req.json() as {
      sessionId:    string;
      actionPoints: number;
    };

    if (!sessionId || typeof actionPoints !== "number") {
      return NextResponse.json({ error: "invalid_params" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: true, offline: true });
    }

    const db = createServerSupabase();
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
