import { NextRequest, NextResponse } from "next/server";
import { explainSegment } from "@/lib/ai/explain-segment";
import { RuleDefinitionSchema } from "@/lib/segments/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ruleDefinition } = body;

    const ruleResult = RuleDefinitionSchema.safeParse(ruleDefinition);
    if (!ruleResult.success) {
      return NextResponse.json(
        { error: "Invalid rule definition", details: ruleResult.error.flatten() },
        { status: 400 }
      );
    }

    const explanation = await explainSegment(ruleResult.data);

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("[API] POST /api/ai/explain-segment error:", error);
    const message = error instanceof Error ? error.message : "Failed to explain segment";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
