import { NextRequest, NextResponse } from "next/server";
import {
  getGameSession,
  completeGameSession,
  upsertPlayerProgress,
  getCollectedClueIds,
  getTalkedNpcs,
} from "@/lib/services/db";
import { checkAndUnlockAchievements } from "@/lib/services/achievements";
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
    const body = (await req.json()) as {
      sessionId:        string;
      accusedKillerId?: KillerId;
      suspectId?:       string;       // 相容簡易呼叫（等同 accusedKillerId）
      accusedMotive?:   MotiveDirection;
      accusedSubMotive?: SubMotiveId;
      alreadyUnlockedAchievements?: string[];
    };

    const {
      sessionId,
      accusedMotive,
      accusedSubMotive,
      alreadyUnlockedAchievements = [],
    } = body;

    // 相容 suspectId（簡易格式）與 accusedKillerId（完整格式）
    const accusedKillerId = (body.accusedKillerId ?? body.suspectId) as KillerId | undefined;

    if (!sessionId || !accusedKillerId) {
      return NextResponse.json(
        { error: "bad_request", message: "缺少必要欄位：sessionId 與 accusedKillerId（或 suspectId）" },
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
    const truthParts       = (session.truth_string ?? "").split("-");
    const correctSubMotive = (truthParts[1] ?? null) as SubMotiveId | null;

    // 3. 判定結果
    const killerCorrect    = session.killer_id === accusedKillerId;
    const motiveCorrect    = session.motive_direction === accusedMotive;
    const subMotiveCorrect = correctSubMotive !== null && accusedSubMotive === correctSubMotive;
    const correct          = killerCorrect && motiveCorrect;

    const score = (killerCorrect ? 50 : 0)
                + (motiveCorrect ? 20 : 0)
                + (subMotiveCorrect ? 30 : 0);

    const result = correct ? "win" : "lose";

    // 4. 取得進度資訊（供成就判斷）
    const [clueIds, talkedNpcs] = await Promise.all([
      getCollectedClueIds(sessionId),
      getTalkedNpcs(sessionId),
    ]);

    // 5. 成就解鎖檢查（A2）
    const newAchievements = checkAndUnlockAchievements(
      {
        killerCorrect,
        motiveCorrect,
        subMotiveCorrect,
        score,
        accusedKillerId,
        playerIdentity: (session.player_identity ?? "normal") as "normal" | "phase2",
        difficulty:     session.difficulty ?? "normal",
        clueCount:      clueIds.length,
        talkedNpcCount: talkedNpcs.length,
      },
      alreadyUnlockedAchievements,
    );

    // 6. 寫入結局（非同步）
    completeGameSession(sessionId, result, score);
    upsertPlayerProgress(session.player_name, correct);

    // 7. 回傳結果
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
      newAchievements: newAchievements.map((a) => ({ id: a.id, name: a.name })),
    });
  } catch (err) {
    console.error("[POST /api/game/accuse]", err);
    return NextResponse.json(
      { error: "server_error", message: "伺服器暫時異常。" },
      { status: 500 },
    );
  }
}
