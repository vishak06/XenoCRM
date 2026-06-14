import { NextRequest, NextResponse } from "next/server";
import { parseIntent } from "@/lib/ai/parse-intent";
import { prisma } from "@/lib/prisma";

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

    const existingSegments = await prisma.segment.findMany({
      select: { name: true, description: true }
    });

    let contextStr = "";
    if (existingSegments.length > 0) {
      contextStr = `Here are the existing segments in the database:\n${existingSegments.map(s => `- ${s.name}: ${s.description || "No description"}`).join('\n')}`;
    }

    const result = await parseIntent(message, contextStr);

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
