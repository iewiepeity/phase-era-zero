import { NextRequest, NextResponse } from "next/server";
import { getSceneVisit, recordSceneVisit } from "@/lib/services/db";

// ── GET /api/game/scene/visits?sessionId=&sceneId= ────────────

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const sceneId   = req.nextUrl.searchParams.get("sceneId");

  if (!sessionId || !sceneId) {
    return NextResponse.json({ error: "missing sessionId or sceneId" }, { status: 400 });
  }

  try {
    const visit = await getSceneVisit(sessionId, sceneId);
    return NextResponse.json({ visit });
  } catch (err) {
    console.error("[GET /api/game/scene/visits]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// ── POST /api/game/scene/visits ───────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      sessionId: string;
      sceneId:   string;
    };

    const { sessionId, sceneId } = body;

    if (!sessionId || !sceneId) {
      return NextResponse.json({ error: "missing sessionId or sceneId" }, { status: 400 });
    }

    await recordSceneVisit(sessionId, sceneId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/game/scene/visits]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
