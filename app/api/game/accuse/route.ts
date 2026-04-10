import { NextRequest, NextResponse } from "next/server";
import {
  getGameSession,
  completeGameSession,
  upsertPlayerProgress,
} from "@/lib/services/db";
import type { KillerId, MotiveDirection } from "@/lib/case-config";

// ── POST /api/game/accuse ─────────────────────────────────────
// 玩家提交指控：killerId + motiveDirection
// 與 game_sessions 中存的真實答案比對，回傳結果並更新紀錄
export async function POST(req: NextRequest) {
  try {
    const { sessionId, accusedKillerId, accusedMotive } = (await req.json()) as {
      sessionId:        string;
      accusedKillerId:  KillerId;
      accusedMotive:    MotiveDirection;
    };

    if (!sessionId || !accusedKillerId || !accusedMotive) {
      return NextResponse.json(
        { error: "bad_request", message: "缺少必要欄位：sessionId, accusedKillerId, accusedMotive" },
        { status: 400 },
      );
    }

    // 1. 取得本局正確答案
    const session = await getGameSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: "not_found", message: "找不到對應的遊戲場次。" },
        { status: 404 },
      );
    }
    if (session.status !== "active") {
      return NextResponse.json(
        { error: "session_ended", message: "這場遊戲已經結束。" },
        { status: 400 },
      );
    }

    // 2. 判定結果
    const killerCorrect = session.killer_id === accusedKillerId;
    const motiveCorrect = session.motive_direction === accusedMotive;
    const correct       = killerCorrect && motiveCorrect;
    const score         = (killerCorrect ? 60 : 0) + (motiveCorrect ? 40 : 0);
    const result        = correct ? "win" : "lose";

    // 3. 寫入結局（非同步，不阻塞回應）
    completeGameSession(sessionId, result, score);
    upsertPlayerProgress(session.player_name, correct);

    // 4. 回傳結果（遊戲結束後才揭露正確答案）
    return NextResponse.json({
      correct,
      killerCorrect,
      motiveCorrect,
      score,
      result,
      answer: {
        killerId:        session.killer_id        as KillerId,
        motiveDirection: session.motive_direction as MotiveDirection,
      },
    });
  } catch (err) {
    console.error("[POST /api/game/accuse]", err);
    return NextResponse.json(
      { error: "server_error", message: "伺服器暫時異常。" },
      { status: 500 },
    );
  }
}
