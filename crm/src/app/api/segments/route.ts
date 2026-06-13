import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { RuleDefinitionSchema } from "@/lib/segments/schema";
import { ruleToPrismaWhere, filterByOrderCount } from "@/lib/segments/rule-to-prisma";
import { ruleToEnglish } from "@/lib/segments/rule-to-english";

export async function GET() {
  try {
    const segments = await prisma.segment.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Compute live match counts for each segment
    const segmentsWithCounts = await Promise.all(
      segments.map(async (segment) => {
        const rule = RuleDefinitionSchema.safeParse(segment.ruleDefinition);
        let matchCount = 0;
        let englishDescription = "";

        if (rule.success) {
          const { where, orderCountConditions } = ruleToPrismaWhere(rule.data);

          if (orderCountConditions.length > 0) {
            const customers = await prisma.customer.findMany({
              where,
              include: { _count: { select: { orders: true } } },
            });
            matchCount = filterByOrderCount(customers, orderCountConditions, rule.data.combinator).length;
          } else {
            matchCount = await prisma.customer.count({ where });
          }

          englishDescription = ruleToEnglish(rule.data);
        }

        return {
          ...segment,
          matchCount,
          englishDescription,
        };
      })
    );

    return NextResponse.json({ segments: segmentsWithCounts });
  } catch (error) {
    console.error("[API] GET /api/segments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch segments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate rule definition
    const ruleResult = RuleDefinitionSchema.safeParse(body.ruleDefinition);
    if (!ruleResult.success) {
      return NextResponse.json(
        { error: "Invalid rule definition", details: ruleResult.error.flatten() },
        { status: 400 }
      );
    }

    const segment = await prisma.segment.create({
      data: {
        name: body.name,
        description: body.description || null,
        ruleDefinition: body.ruleDefinition,
      },
    });

    return NextResponse.json(segment, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/segments error:", error);
    return NextResponse.json(
      { error: "Failed to create segment" },
      { status: 500 }
    );
  }
}
