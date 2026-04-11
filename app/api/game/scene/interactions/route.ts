import { NextRequest, NextResponse } from "next/server";
import { getSceneInteractions, recordSceneInteraction } from "@/lib/services/db";
import { addInventoryItem, addPlayerClue } from "@/lib/services/db";
import { getSceneItems } from "@/lib/content/scene-items";

// ── GET /api/game/scene/interactions?sessionId=&sceneId= ──────

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const sceneId   = req.nextUrl.searchParams.get("sceneId");

  if (!sessionId || !sceneId) {
    return NextResponse.json({ error: "missing sessionId or sceneId" }, { status: 400 });
  }

  try {
    const interactions = await getSceneInteractions(sessionId, sceneId);
    return NextResponse.json({ interactions });
  } catch (err) {
    console.error("[GET /api/game/scene/interactions]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// ── POST /api/game/scene/interactions ─────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      sessionId:       string;
      sceneId:         string;
      itemId:          string;
      interactionType: string;
    };

    const { sessionId, sceneId, itemId, interactionType } = body;

    if (!sessionId || !sceneId || !itemId || !interactionType) {
      return NextResponse.json({ error: "missing required fields" }, { status: 400 });
    }

    // Record the interaction
    await recordSceneInteraction(sessionId, sceneId, itemId, interactionType);

    // Look up item definition for side effects
    const items = getSceneItems(sceneId);
    const item  = items.find((i) => i.id === itemId);

    if (item) {
      // If pickup → add to inventory
      if (interactionType === "pickup" && item.pickable && item.inventoryEntry) {
        await addInventoryItem(sessionId, {
          item_name:    item.inventoryEntry.name,
          description:  item.inventoryEntry.description,
          source_scene: sceneId,
          icon:         item.inventoryEntry.icon,
        });
      }

      // If discover → add clue
      if (interactionType === "discover" && item.triggersClue && item.clueContent) {
        await addPlayerClue(sessionId, {
          clue_text:    item.clueContent,
          clue_type:    "scene",
          source_scene: sceneId,
          category:     "general",
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/game/scene/interactions]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
