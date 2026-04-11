/**
 * GET /api/game/chat-log?sessionId=xxx
 *
 * 取得本局所有對話記錄，按 NPC 分組。
 * 若 Supabase 未設定，回傳空陣列（offline 模式）。
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase";

export interface ChatLogEntry {
  npc_id:     string;
  role:       "user" | "assistant";
  content:    string;
  created_at: string;
}

export interface ChatLogByNpc {
  npcId:    string;
  messages: ChatLogEntry[];
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "missing_session" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ groups: [] as ChatLogByNpc[] });
  }

  try {
    const db = createServerSupabase();
    const { data, error } = await db
      .from("chat_messages")
      .select("npc_id, role, content, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[chat-log] GET:", error.message);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    // Group by npc_id
    const groupMap = new Map<string, ChatLogEntry[]>();
    for (const row of (data ?? []) as ChatLogEntry[]) {
      if (!groupMap.has(row.npc_id)) groupMap.set(row.npc_id, []);
      groupMap.get(row.npc_id)!.push(row);
    }

    const groups: ChatLogByNpc[] = Array.from(groupMap.entries()).map(([npcId, messages]) => ({
      npcId,
      messages,
    }));

    return NextResponse.json({ groups });
  } catch (e) {
    console.error("[chat-log] GET:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
