import { NextRequest, NextResponse } from "next/server";
import { draftMessage } from "@/lib/ai/draft-message";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel, tone, offerDescription, segmentDescription } = body;

    if (!channel || !tone || !offerDescription) {
      return NextResponse.json(
        { error: "channel, tone, and offerDescription are required" },
        { status: 400 }
      );
    }

    const messageTemplate = await draftMessage({
      channel,
      tone,
      offerDescription,
      segmentDescription: segmentDescription || "targeted customers",
    });

    return NextResponse.json({ messageTemplate });
  } catch (error) {
    console.error("[API] POST /api/ai/draft-message error:", error);
    const message = error instanceof Error ? error.message : "Failed to draft message";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
