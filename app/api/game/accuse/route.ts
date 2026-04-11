import { NextRequest, NextResponse } from "next/server";
import {
  getGameSession,
  completeGameSession,
  upsertPlayerProgress,
} from "@/lib/services/db";
import type { KillerId, MotiveDirection, SubMotiveId } from "@/lib/case-config";

// ── POST /api/game/accuse ─────────────────────────────────────
// 玩家提交指控：killerId + motiveDirection + subMotiveId
// 與 game_sessions 中存的真實答案比對，回傳結果並更新紀錄
//
// 評分：
//   兇手正確 = 50 分
//   動機方向正確 = 20 分
//   子動機正確 = 30 分
//   總分 100 分
//
// 勝利條件：兇手 + 動機方向 都正確（≥ 70 分）
export async function POST(req: NextRequest) {
  try {
    const { sessionId, accusedKillerId, accusedMotive, accusedSubMotive } = (await req.json()) as {
      sessionId:        string;
      accusedKillerId:  KillerId;
      accusedMotive:    MotiveDirection;
      accusedSubMotive: SubMotiveId;
    };

    if (!sessionId || !accusedKillerId || !accusedMotive || !accusedSubMotive) {
      return NextResponse.json(
        { error: "bad_request", message: "缺少必要欄位：sessionId, accusedKillerId, accusedMotive, accusedSubMotive" },
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

    // 2. 從 truth_string 解析子動機（格式：P{motive}{killerIdx}-{subMotive}-{mmdd}-...）
    // truth_string 第 2 段（split('-')[1]）即為子動機代碼
    const truthParts       = (session.truth_string ?? "").split("-");
    const correctSubMotive = (truthParts[1] ?? null) as SubMotiveId | null;

    // 3. 判定結果
    const killerCorrect    = session.killer_id === accusedKillerId;
    const motiveCorrect    = session.motive_direction === accusedMotive;
    const subMotiveCorrect = correctSubMotive !== null && accusedSubMotive === correctSubMotive;
    const correct          = killerCorrect && motiveCorrect;   // 勝利條件：兇手 + 方向

    const score = (killerCorrect ? 50 : 0)
                + (motiveCorrect ? 20 : 0)
                + (subMotiveCorrect ? 30 : 0);

    const result = correct ? "win" : "lose";

    // 4. 寫入結局（非同步）
    completeGameSession(sessionId, result, score);
    upsertPlayerProgress(session.player_name, correct);

    // 5. 回傳結果
    return NextResponse.json({
      correct,
      killerCorrect,
      motiveCorrect,
      subMotiveCorrect,
      score,
      result,
      answer: {
        killerId:        session.killer_id        as KillerId,
        motiveDirection: session.motive_direction as MotiveDirection,
        subMotiveId:     correctSubMotive,
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
