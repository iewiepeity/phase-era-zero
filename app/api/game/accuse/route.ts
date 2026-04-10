import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { KillerId, MotiveDirection } from "@/lib/case-config";

// ── POST /api/game/accuse ─────────────────────────────────────
// 玩家提交指控：killerId + motiveDirection
// 與 game_sessions 中存的真實答案比對，回傳結果並更新紀錄
export async function POST(req: NextRequest) {
  try {
    const {
      sessionId,
      accusedKillerId,
      accusedMotive,
    } = (await req.json()) as {
      sessionId: string;
      accusedKillerId: KillerId;
      accusedMotive: MotiveDirection;
    };

    if (!sessionId || !accusedKillerId || !accusedMotive) {
      return NextResponse.json(
        { error: "bad_request", message: "缺少必要欄位：sessionId, accusedKillerId, accusedMotive" },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      // 無 DB 模式：直接回傳未知（不應出現在正常流程）
      return NextResponse.json({
        correct: null,
        message: "Supabase 未設定，無法驗證指控。",
      });
    }

    const db = createServerSupabase();

    // 1. 取得本局的正確答案
    const { data: session, error: fetchError } = await db
      .from("game_sessions")
      .select("id, killer_id, motive_direction, status")
      .eq("id", sessionId)
      .single();

    if (fetchError || !session) {
      return NextResponse.json(
        { error: "not_found", message: "找不到對應的遊戲場次。" },
        { status: 404 }
      );
    }

    if (session.status !== "active") {
      return NextResponse.json(
        { error: "session_ended", message: "這場遊戲已經結束。" },
        { status: 400 }
      );
    }

    // 2. 判定結果
    const killerCorrect = session.killer_id === accusedKillerId;
    const motiveCorrect = session.motive_direction === accusedMotive;
    const correct = killerCorrect && motiveCorrect;

    // 3. 計算分數
    // 滿分 100：兇手對 60 分 + 動機對 40 分
    const score = (killerCorrect ? 60 : 0) + (motiveCorrect ? 40 : 0);
    const result = correct ? "win" : "lose";

    // 4. 更新 game_sessions
    await db
      .from("game_sessions")
      .update({
        status: "completed",
        result,
        score,
        ended_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    // 5. 更新 player_progress（最多嘗試一次，失敗不阻塞回應）
    try {
      const playerName = (
        await db
          .from("game_sessions")
          .select("player_name")
          .eq("id", sessionId)
          .single()
      ).data?.player_name;

      if (playerName) {
        const { data: progress } = await db
          .from("player_progress")
          .select("id, total_games, wins")
          .eq("player_name", playerName)
          .maybeSingle();

        if (progress) {
          await db
            .from("player_progress")
            .update({
              total_games: (progress.total_games ?? 0) + 1,
              wins: (progress.wins ?? 0) + (correct ? 1 : 0),
              updated_at: new Date().toISOString(),
            })
            .eq("id", progress.id);
        } else {
          await db.from("player_progress").insert({
            player_name: playerName,
            total_games: 1,
            wins: correct ? 1 : 0,
          });
        }
      }
    } catch (e) {
      console.warn("[accuse] player_progress update:", e);
    }

    // 6. 回傳結果（揭露正確答案）
    return NextResponse.json({
      correct,
      killerCorrect,
      motiveCorrect,
      score,
      result,
      // 揭露正確答案（遊戲結束後才揭露）
      answer: {
        killerId: session.killer_id as KillerId,
        motiveDirection: session.motive_direction as MotiveDirection,
      },
    });
  } catch (err) {
    console.error("[POST /api/game/accuse]", err);
    return NextResponse.json(
      { error: "server_error", message: "伺服器暫時異常。" },
      { status: 500 }
    );
  }
}
