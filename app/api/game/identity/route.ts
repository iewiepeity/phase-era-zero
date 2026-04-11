import { NextRequest, NextResponse } from "next/server";
import { updatePlayerIdentity } from "@/lib/services/db";

/**
 * PATCH /api/game/identity
 * Body: { sessionId: string; identity: "normal" | "phase2" }
 *
 * 身份選擇頁選完後呼叫，寫入 game_sessions.player_identity。
 */
export async function PATCH(req: NextRequest) {
  try {
    const { sessionId, identity } = (await req.json()) as {
      sessionId: string;
      identity:  "normal" | "phase2";
    };

    if (!sessionId || !["normal", "phase2"].includes(identity)) {
      return NextResponse.json(
        { error: "invalid_params", message: "sessionId 和 identity 為必填" },
        { status: 400 },
      );
    }

    await updatePlayerIdentity(sessionId, identity);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/game/identity]", err);
    return NextResponse.json(
      { error: "server_error", message: "寫入身份時發生錯誤" },
      { status: 500 },
    );
  }
}
