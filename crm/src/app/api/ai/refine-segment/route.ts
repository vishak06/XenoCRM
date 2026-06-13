import { NextRequest, NextResponse } from "next/server";
import { refineSegment } from "@/lib/ai/refine-segment";
import { RuleDefinitionSchema } from "@/lib/segments/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentSegment, messageIntent, refinementMessage, conversationHistory } = body;

    if (!refinementMessage || typeof refinementMessage !== "string") {
      return NextResponse.json(
        { error: "Refinement message is required" },
        { status: 400 }
      );
    }

    const segmentResult = RuleDefinitionSchema.safeParse(currentSegment);
    if (!segmentResult.success) {
      return NextResponse.json(
        { error: "Invalid current segment", details: segmentResult.error.flatten() },
        { status: 400 }
      );
    }

    const result = await refineSegment(
      segmentResult.data,
      messageIntent || { channel: "WHATSAPP", tone: "friendly", offerDescription: "" },
      refinementMessage,
      conversationHistory || []
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] POST /api/ai/refine-segment error:", error);
    const message = error instanceof Error ? error.message : "Failed to refine segment";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
