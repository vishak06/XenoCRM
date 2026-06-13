import { NextRequest, NextResponse } from "next/server";
import { parseIntent } from "@/lib/ai/parse-intent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const result = await parseIntent(message);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] POST /api/ai/parse-intent error:", error);
    const message = error instanceof Error ? error.message : "Failed to parse intent";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
