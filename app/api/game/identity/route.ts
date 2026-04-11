import { NextRequest, NextResponse } from "next/server";
import { updatePlayerIdentity } from "@/lib/services/db";

/**
 * PATCH /api/game/identity
 * Body: { sessionId: string; identity: "normal" | "phase2" | "detective" }
 *
 * 身份選擇頁選完後呼叫，寫入 game_sessions.player_identity。
 * "detective" 為 "normal" 的別名（相容舊版呼叫）。
 */

// "detective" 視為 "normal" 的相容別名
const IDENTITY_ALIASES: Record<string, "normal" | "phase2"> = {
  normal:    "normal",
  phase2:    "phase2",
  detective: "normal",   // 相容舊版欄位值
};

export async function PATCH(req: NextRequest) {
  try {
    const { sessionId, identity: rawIdentity } = (await req.json()) as {
      sessionId: string;
      identity:  string;
    };

    const identity = IDENTITY_ALIASES[rawIdentity];

    if (!sessionId || !identity) {
      return NextResponse.json(
        { error: "invalid_params", message: "sessionId 和合法 identity 為必填（normal / phase2 / detective）" },
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
