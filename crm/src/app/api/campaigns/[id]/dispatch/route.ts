import { NextRequest, NextResponse } from "next/server";
import { dispatchCampaign } from "@/lib/dispatch/worker";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fire and report — dispatch runs synchronously but returns result
    const result = await dispatchCampaign(id);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[API] POST /api/campaigns/[id]/dispatch error:", error);
    return NextResponse.json(
      { error: "Failed to dispatch campaign" },
      { status: 500 }
    );
  }
}
