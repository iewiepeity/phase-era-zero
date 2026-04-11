import { NextRequest, NextResponse } from "next/server";
import { updateDifficulty } from "@/lib/services/db";
import { toDifficultyDbValue, type DifficultyId } from "@/lib/content/difficulty";

const VALID_DIFFICULTIES: DifficultyId[] = ["easy", "normal", "hard", "nightmare"];

/**
 * PATCH /api/game/difficulty
 * Body: { sessionId: string; difficulty: DifficultyId }
 *
 * 難度選擇頁選完後呼叫，寫入 game_sessions.difficulty。
 * 'nightmare' 在 DB 中存為 'hard'（前端保留完整顯示）。
 */
export async function PATCH(req: NextRequest) {
  try {
    const { sessionId, difficulty } = (await req.json()) as {
      sessionId:  string;
      difficulty: DifficultyId;
    };

    if (!sessionId || !VALID_DIFFICULTIES.includes(difficulty)) {
      return NextResponse.json(
        { error: "invalid_params", message: "sessionId 和合法 difficulty 為必填" },
        { status: 400 },
      );
    }

    await updateDifficulty(sessionId, toDifficultyDbValue(difficulty));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/game/difficulty]", err);
    return NextResponse.json(
      { error: "server_error", message: "寫入難度時發生錯誤" },
      { status: 500 },
    );
  }
}
