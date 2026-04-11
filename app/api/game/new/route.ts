import { NextRequest, NextResponse } from "next/server";
import { abandonActiveSessions, createGameSession } from "@/lib/services/db";
import { isSupabaseConfigured } from "@/lib/supabase";
import { generateCase } from "@/lib/random-engine";
import type { KillerId, MotiveDirection } from "@/lib/case-config";

// ── POST /api/game/new ────────────────────────────────────────
// 開新局：隨機生成案件配置，寫入 game_sessions，回傳 sessionId
// truthString 絕不對前端揭露
export async function POST(req: NextRequest) {
  try {
    const { guestId, seed, forceKiller, forceMotive } = (await req.json()) as {
      guestId?:      string;
      seed?:         number;
      forceKiller?:  KillerId;
      forceMotive?:  MotiveDirection;
    };

    // 1. 生成案件配置
    const config = generateCase({ seed, forceKiller, forceMotive });

    // 2. 廢棄舊 session 並建立新 session
    if (guestId) await abandonActiveSessions(guestId);

    let sessionId: string | null = null;

    if (isSupabaseConfigured()) {
      // 3a. 有 Supabase — 寫入 DB（失敗時拋出，讓 catch block 回傳明確錯誤）
      sessionId = await createGameSession({
        guestId:         guestId ?? "anonymous",
        killerId:        config.killerId,
        motiveDirection: config.motiveDirection,
        truthString:     config.truthString,
        subMotiveId:     config.subMotiveId,
      });
    } else {
      // 3b. 無 Supabase — 純 local session（開發用 fallback）
      sessionId = `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      console.warn("[new] Supabase 未設定，使用 local session:", sessionId);
    }

    if (!sessionId) {
      throw new Error("createGameSession 回傳 null，DB 寫入失敗");
    }

    // 4. 回傳（不含 truthString / 兇手身份）
    return NextResponse.json({
      sessionId,
      motiveCount:  4,
      suspectCount: 8,
      seed:         config.seed,
      generatedAt:  config.generatedAt,
    });
  } catch (err) {
    console.error("[POST /api/game/new]", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: "server_error", message: msg }, { status: 500 });
  }
}
