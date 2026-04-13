import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { getNpc } from "@/lib/npc-registry";

/**
 * GET /api/phone/sms?sessionId=xxx
 *
 * 回傳此 session 中有過對話的 NPC 列表，
 * 每個 NPC 附最後一則訊息（用於手機 SMS 頁面）。
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ threads: [] });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ threads: [] });
  }

  try {
    const db = createServerSupabase();

    // 取得有過訊息的 NPC，以及最後一則訊息（assistant 回應）
    const { data, error } = await db
      .from("chat_messages")
      .select("npc_id, content, role, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return NextResponse.json({ threads: [] });
    }

    // 依 npc_id 分組，取每個 NPC 最新一則 assistant 訊息
    const seen     = new Set<string>();
    const threads: {
      npcId:    string;
      npcName:  string;
      lastMsg:  string;
      lastTime: string;
      unread:   boolean;
    }[] = [];

    for (const row of data) {
      if (seen.has(row.npc_id)) continue;
      if (row.role !== "assistant") continue;

      seen.add(row.npc_id);
      const npc     = getNpc(row.npc_id);
      const npcName = npc?.name ?? row.npc_id;

      // 格式化時間（只顯示時:分，若非今日則顯示日期）
      const dt       = new Date(row.created_at);
      const now      = new Date();
      const isToday  =
        dt.getFullYear() === now.getFullYear() &&
        dt.getMonth()    === now.getMonth()    &&
        dt.getDate()     === now.getDate();
      const lastTime = isToday
        ? `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`
        : `${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}`;

      threads.push({
        npcId:   row.npc_id,
        npcName,
        lastMsg: row.content.length > 60 ? row.content.slice(0, 60) + "…" : row.content,
        lastTime,
        unread:  false,
      });
    }

    return NextResponse.json({ threads });
  } catch (e) {
    console.error("[GET /api/phone/sms]", e);
    return NextResponse.json({ threads: [] });
  }
}
