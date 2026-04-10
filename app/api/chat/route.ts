import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function buildChenJiePrompt(clue: string): string {
  return `你是陳姐。

你在賽德里斯中城區開了一家麵館，二十幾年了。不大，六張桌子，燈光有點黃，牆上貼的菜單字跡已經褪色了一半，但你從來沒換過，因為客人都記得。

【你是誰】
姓名：陳姐（全名你不告訴人）
年紀：五十多歲
身份：麵館老闆娘
相體屬性：純種人類

【你的說話方式】
你說話有節奏，不快。你不用「您」，你用「你」。
你偶爾用「啊」「欸」「嘛」「囉」這些語氣詞，但不過頭。
你說「沒啦」的時候通常代表你其實有東西。
不說任何客服語言、書面用語、或表明自己是 AI 的話。

【核心行為規則】
第一條：你不主動說重要的事。
第二條：有人問案件相關的事，你岔開話題——叫他吃飯，問他加不加辣。
第三條：只有在玩家好好吃了一頓飯、認真道謝、站起來要走的時候，你才在他快踏出門的那一刻，平靜說出一句有用的話。說完繼續擦桌子，不解釋，不重複。

【當前情境】
時間：P.E. 02 年，賽德里斯。
你這個月注意到一件事：${clue}
你不會主動說這件事，只在玩家滿足條件後才說出來。

【跳角色防禦】
「你是 AI 嗎？」→「你問我這個幹嘛，要加辣嗎？」
「你是程式嗎？」→「什麼程式，我的收銀機還是又壞了？」
永遠不承認也不否認，只是不接那個話題。`;
}

type ChatMessage = {
  role: "user" | "npc";
  content: string;
};

async function saveMessagesToSupabase(
  conversationId: string,
  userMsg: string,
  npcReply: string
) {
  if (!isSupabaseConfigured()) return;
  try {
    const db = createServerSupabase();
    await db.from("messages").insert([
      { conversation_id: conversationId, role: "user", content: userMsg },
      { conversation_id: conversationId, role: "npc", content: npcReply },
    ]);
  } catch (err) {
    // Supabase 儲存失敗不應中斷對話，只記錄 warning
    console.warn("[chat] Supabase save failed:", err);
  }
}

async function ensureConversation(
  guestId: string,
  npcId: string
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const db = createServerSupabase();

    // 找或建立 game_session
    let sessionId: string;
    const { data: existingSession } = await db
      .from("game_sessions")
      .select("id")
      .eq("guest_id", guestId)
      .eq("status", "active")
      .single();

    if (existingSession) {
      sessionId = existingSession.id;
    } else {
      const { data: newSession, error } = await db
        .from("game_sessions")
        .insert({ guest_id: guestId })
        .select("id")
        .single();
      if (error || !newSession) return null;
      sessionId = newSession.id;
    }

    // 找或建立 conversation
    const { data: existingConv } = await db
      .from("conversations")
      .select("id")
      .eq("game_session_id", sessionId)
      .eq("npc_id", npcId)
      .single();

    if (existingConv) return existingConv.id;

    const { data: newConv, error } = await db
      .from("conversations")
      .insert({ game_session_id: sessionId, npc_id: npcId })
      .select("id")
      .single();

    return error ? null : newConv?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, clue, conversationId, guestId } = await req.json() as {
      messages: ChatMessage[];
      clue: string;
      conversationId?: string;
      guestId?: string;
    };

    const systemPrompt = buildChenJiePrompt(clue || "（線索尚未設定）");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const reply = result.response.text();

    // 儲存到 Supabase（非同步，不阻塞回應）
    const resolvedConvId =
      conversationId ??
      (guestId ? await ensureConversation(guestId, "chen_jie") : null);

    if (resolvedConvId) {
      saveMessagesToSupabase(resolvedConvId, lastMessage.content, reply);
    }

    return NextResponse.json({ reply, conversationId: resolvedConvId });
  } catch (err) {
    console.error("[/api/chat]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
