import { NextRequest, NextResponse } from "next/server";
import {
  getGameSession,
  completeGameSession,
  upsertPlayerProgress,
  getCollectedClueIds,
  getTalkedNpcs,
} from "@/lib/services/db";
import { checkAndUnlockAchievements } from "@/lib/services/achievements";
import { SUSPECTS, MOTIVES } from "@/lib/case-config";
import type { KillerId, MotiveDirection, SubMotiveId } from "@/lib/case-config";

/** local_ session（無 Supabase）時，以 sessionId hash 產生確定性答案 */
function buildLocalSession(sessionId: string) {
  const hash    = sessionId.replace(/^local_/, "").split("_")[0] ?? "0";
  const seed    = parseInt(hash, 36) % 10000;
  const killerKeys = Object.keys(SUSPECTS) as KillerId[];
  const motiveKeys = Object.keys(MOTIVES) as MotiveDirection[];
  const subIds  = ["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2"] as SubMotiveId[];
  const killer  = killerKeys[seed % killerKeys.length];
  const motive  = motiveKeys[seed % motiveKeys.length];
  const sub     = subIds[seed % subIds.length];
  return {
    id:               sessionId,
    killer_id:        killer,
    motive_direction: motive,
    truth_string:     `P${motive}0-${sub}-0000`,
    player_name:      "local",
    status:           "active" as const,
    difficulty:       "normal",
    player_identity:  "normal",
  };
}

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
    const {
      sessionId,
      accusedKillerId,
      accusedMotive,
      accusedSubMotive,
      alreadyUnlockedAchievements = [],
    } = (await req.json()) as {
      sessionId:        string;
      accusedKillerId:  KillerId;
      accusedMotive:    MotiveDirection;
      accusedSubMotive: SubMotiveId;
      alreadyUnlockedAchievements?: string[];
    };

    if (!sessionId || !accusedKillerId || !accusedMotive || !accusedSubMotive) {
      return NextResponse.json(
        { error: "bad_request", message: "缺少必要欄位：sessionId, accusedKillerId, accusedMotive, accusedSubMotive" },
        { status: 400 },
      );
    }

    // 1. 取得本局正確答案（無 Supabase 時使用本地確定性答案）
    const dbSession = await getGameSession(sessionId);
    const session   = dbSession ?? (sessionId.startsWith("local_") ? buildLocalSession(sessionId) : null);
    if (!session) {
      return NextResponse.json(
        { error: "not_found", message: "找不到對應的遊戲場次。請確認遊戲是否已正確建立。" },
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
