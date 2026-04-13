import { NextRequest, NextResponse } from "next/server";
import { updateDisplayName } from "@/lib/services/db";

export async function PATCH(req: NextRequest) {
  try {
    const { sessionId, displayName } = (await req.json()) as {
      sessionId?:   string;
      displayName?: string;
    };

    if (!sessionId || !displayName) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    const name = displayName.trim().slice(0, 12);
    await updateDisplayName(sessionId, name);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
