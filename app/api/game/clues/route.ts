import { NextRequest, NextResponse } from "next/server";
import { getPlayerClues, addPlayerClue } from "@/lib/services/db";

// ── GET /api/game/clues?sessionId=... ─────────────────────────
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "missing sessionId" }, { status: 400 });
  }

  try {
    const clues = await getPlayerClues(sessionId);
    return NextResponse.json({ clues });
  } catch (err) {
    console.error("[GET /api/game/clues]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// ── POST /api/game/clues ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      sessionId:     string;
      clue_text:     string;
      clue_type:     "npc" | "scene" | "deduced";
      source_npc?:   string;
      source_scene?: string;
      category?:     "relationship" | "motive" | "method" | "alibi" | "general";
    };

    const { sessionId, clue_text, clue_type, source_npc, source_scene, category } = body;

    if (!sessionId || !clue_text || !clue_type) {
      return NextResponse.json({ error: "missing required fields" }, { status: 400 });
    }

    const clue = await addPlayerClue(sessionId, {
      clue_text,
      clue_type,
      source_npc,
      source_scene,
      category,
    });

    return NextResponse.json({ clue });
  } catch (err) {
    console.error("[POST /api/game/clues]", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: "server_error", message: msg }, { status: 500 });
  }
}
