import { NextRequest, NextResponse } from "next/server";
import {
  getSceneInteractions,
  recordSceneInteraction,
  addInventoryItem,
  addPlayerClue,
  getCollectedClueIds,
  getTalkedNpcs,
  getCriticalClueCount,
  updateCurrentAct,
} from "@/lib/services/db";
import { getSceneItems } from "@/lib/content/scene-items";
import { checkAndUnlockAchievements } from "@/lib/services/achievements";
import { checkActProgression } from "@/lib/services/act-progression";

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
      sessionId:                    string;
      sceneId:                      string;
      itemId:                       string;
      interactionType:              string;
      currentAct?:                  number;
      visitedSceneIds?:             string[];
      alreadyUnlockedAchievements?: string[];
    };

    const {
      sessionId,
      sceneId,
      itemId,
      interactionType,
      currentAct                  = 1,
      visitedSceneIds             = [],
      alreadyUnlockedAchievements = [],
    } = body;

    if (!sessionId || !sceneId || !itemId || !interactionType) {
      return NextResponse.json({ error: "missing required fields" }, { status: 400 });
    }

    // 記錄互動
    await recordSceneInteraction(sessionId, sceneId, itemId, interactionType);

    // 查物件定義，處理副作用
    const items = getSceneItems(sceneId);
    const item  = items.find((i) => i.id === itemId);

    let discoveredClue: { text: string } | null = null;

    if (item) {
      if (interactionType === "pickup" && item.pickable && item.inventoryEntry) {
        await addInventoryItem(sessionId, {
          item_name:    item.inventoryEntry.name,
          description:  item.inventoryEntry.description,
          source_scene: sceneId,
          icon:         item.inventoryEntry.icon,
        });
      }

      if (interactionType === "discover" && item.triggersClue && item.clueContent) {
        await addPlayerClue(sessionId, {
          clue_text:    item.clueContent,
          clue_type:    "scene",
          source_scene: sceneId,
          category:     "general",
        });
        discoveredClue = { text: item.clueContent };
      }
    }

    // 並行載入進度資訊（成就 + 幕次共用）
    const [clueIds, talkedNpcs] = await Promise.all([
      getCollectedClueIds(sessionId),
      getTalkedNpcs(sessionId),
    ]);

    // 幕次推進檢查（A5）
    let actProgression: { advanced: boolean; newAct: number; unlockedScenes?: string[] } | null = null;
    if (currentAct < 2) {
      const criticalCount = await getCriticalClueCount(sessionId);
      const progression   = checkActProgression(currentAct, criticalCount, talkedNpcs.length);
      if (progression.advanced) {
        await updateCurrentAct(sessionId, progression.newAct);
        actProgression = {
          advanced:       true,
          newAct:         progression.newAct,
          unlockedScenes: progression.unlockedScenes,
        };
      }
    }

    // 成就解鎖檢查（A2）— 無論幕次都要檢查
    const newAchievements = checkAndUnlockAchievements(
      {
        clueCount:       clueIds.length + (discoveredClue ? 1 : 0),
        visitedSceneIds: [...new Set([...visitedSceneIds, sceneId])],
        talkedNpcCount:  talkedNpcs.length,
      },
      alreadyUnlockedAchievements,
    );

    return NextResponse.json({
      ok: true,
      discoveredClue,
      actProgression,
      newAchievements: newAchievements.map((a) => ({ id: a.id, name: a.name })),
    });
  } catch (err) {
    console.error("[POST /api/game/scene/interactions]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
