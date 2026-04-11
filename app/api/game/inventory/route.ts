import { NextRequest, NextResponse } from "next/server";
import { getPlayerInventory, addInventoryItem } from "@/lib/services/db";

// ── GET /api/game/inventory?sessionId=... ─────────────────────
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "missing sessionId" }, { status: 400 });
  }

  try {
    const items = await getPlayerInventory(sessionId);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[GET /api/game/inventory]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// ── POST /api/game/inventory ──────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      sessionId:     string;
      item_name:     string;
      description:   string;
      source_npc?:   string;
      source_scene?: string;
      icon?:         string;
    };

    const { sessionId, item_name, description, source_npc, source_scene, icon } = body;

    if (!sessionId || !item_name || !description) {
      return NextResponse.json({ error: "missing required fields" }, { status: 400 });
    }

    await addInventoryItem(sessionId, {
      item_name,
      description,
      source_npc,
      source_scene,
      icon,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/game/inventory]", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: "server_error", message: msg }, { status: 500 });
  }
}
