import { NextRequest, NextResponse } from "next/server";
import { getPlayerClues, addPlayerClue, saveClueCombination } from "@/lib/services/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const GEMINI_MODEL = "gemini-2.5-flash";

// ── POST /api/game/clues/combine ──────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      sessionId: string;
      clueIds:   string[];
    };

    const { sessionId, clueIds } = body;

    if (!sessionId || !clueIds || clueIds.length < 2 || clueIds.length > 3) {
      return NextResponse.json(
        { error: "需要選取 2-3 條線索" },
        { status: 400 },
      );
    }

    // 1. 從 DB 取得選取的線索文字
    const allClues = await getPlayerClues(sessionId);
    const selected = allClues.filter((c) => clueIds.includes(c.clue_id));

    if (selected.length < 2) {
      return NextResponse.json(
        { error: "找不到指定的線索" },
        { status: 404 },
      );
    }

    const cluesText = selected.map((c) => `- ${c.clue_text}`).join("\n");

    // 2. 呼叫 Gemini 合成推理結論
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt =
      `以下是偵探在賽德里斯調查中收集到的幾條線索。請根據這些線索推導出一條新的合理推理結論（一句話，以「推理結論：」開頭）。\n\n${cluesText}`;

    const result = await model.generateContent(prompt);
    const deducedText = result.response.text().trim();

    // 3. 儲存推理線索到 player_clues
    const newClue = await addPlayerClue(sessionId, {
      clue_text:  deducedText,
      clue_type:  "deduced",
      category:   "general",
    });

    // 4. 若成功儲存，記錄合併關係
    if (newClue) {
      await saveClueCombination(sessionId, clueIds, newClue.clue_id);
    }

    return NextResponse.json({ clue: newClue ?? { clue_text: deducedText, clue_type: "deduced" } });
  } catch (err) {
    console.error("[POST /api/game/clues/combine]", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: "server_error", message: msg }, { status: 500 });
  }
}
