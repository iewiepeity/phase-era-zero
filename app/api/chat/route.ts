import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ─────────────────────────────────────────────────────────────
// System Prompt 組裝（Phase 0 版，之後由 build_npc_prompt() 取代）
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// Supabase 輔助函式
// ─────────────────────────────────────────────────────────────

/** 找到既有的 active session，或建立一個 Phase 0 用的佔位 session */
async function ensureSession(guestId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const db = createServerSupabase();

    // 用 player_name 當訪客識別鍵（Phase 0 暫代 user auth）
    const { data: existing } = await db
      .from("game_sessions")
      .select("id")
      .eq("player_name", guestId)
      .eq("status", "active")
      .maybeSingle();

    if (existing) return existing.id;

    // 建立 Phase 0 佔位 session（killer_id / motive_direction 為必填欄位）
    const { data: created, error } = await db
      .from("game_sessions")
      .insert({
        player_name: guestId,
        killer_id: "phase0_placeholder",   // Phase 3 隨機抽選後會覆蓋
        motive_direction: "A",             // 預設路線 A
        status: "active",
      })
      .select("id")
      .single();

    if (error) {
      console.warn("[chat] create session failed:", error.message);
      return null;
    }
    return created.id;
  } catch (e) {
    console.warn("[chat] ensureSession error:", e);
    return null;
  }
}

/** 儲存一對訊息（user + npc）到 chat_messages */
async function saveMessages(
  sessionId: string,
  npcId: string,
  userContent: string,
  npcContent: string
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const db = createServerSupabase();
    await db.from("chat_messages").insert([
      { session_id: sessionId, npc_id: npcId, role: "user",  content: userContent },
      { session_id: sessionId, npc_id: npcId, role: "assistant", content: npcContent },
    ]);
  } catch (e) {
    // 儲存失敗不中斷對話，只 warn
    console.warn("[chat] saveMessages failed:", e);
  }
}

/** 更新 npc_states（conversation_count++） */
async function updateNpcState(sessionId: string, npcId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const db = createServerSupabase();

    // upsert：不存在就建立，存在就 count++
    const { data: existing } = await db
      .from("npc_states")
      .select("id, conversation_count")
      .eq("session_id", sessionId)
      .eq("npc_id", npcId)
      .maybeSingle();

    if (existing) {
      await db
        .from("npc_states")
        .update({ conversation_count: existing.conversation_count + 1 })
        .eq("id", existing.id);
    } else {
      await db
        .from("npc_states")
        .insert({ session_id: sessionId, npc_id: npcId, conversation_count: 1 });
    }
  } catch (e) {
    console.warn("[chat] updateNpcState failed:", e);
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/chat
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { messages, clue, sessionId, guestId } = (await req.json()) as {
      messages: ChatMessage[];
      clue: string;
      sessionId?: string;
      guestId?: string;
    };

    // 1. 組裝 System Prompt
    const systemPrompt = buildChenJiePrompt(clue || "（線索尚未設定）");

    // 2. 呼叫 Gemini
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

    // 3. 持久化到 Supabase（非同步，不阻塞回應）
    const resolvedSessionId =
      sessionId ??
      (guestId ? await ensureSession(guestId) : null);

    if (resolvedSessionId) {
      // fire-and-forget
      saveMessages(resolvedSessionId, "chen_jie", lastMessage.content, reply);
      updateNpcState(resolvedSessionId, "chen_jie");
    }

    return NextResponse.json({ reply, sessionId: resolvedSessionId });
  } catch (err) {
    console.error("[/api/chat]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
