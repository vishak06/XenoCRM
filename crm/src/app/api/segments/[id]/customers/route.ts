import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ruleToPrismaWhere, filterByOrderCount } from "@/lib/segments/rule-to-prisma";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const segment = await prisma.segment.findUnique({
      where: { id },
    });

    if (!segment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    // Convert to Prisma where clause
    const rule = segment.ruleDefinition as any;
    const { where, orderCountConditions } = ruleToPrismaWhere(rule);

    // Query customers
    const allMatching = await prisma.customer.findMany({
      where,
      include: {
        _count: { select: { orders: true } },
      },
      orderBy: { totalSpend: "desc" },
    });

    // Apply orderCount post-filter if needed
    const filtered = filterByOrderCount(allMatching, orderCountConditions, rule.combinator);

    const customers = filtered.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      city: c.city,
      totalSpend: c.totalSpend,
      lastOrderDate: c.lastOrderDate,
      orderCount: c._count.orders,
      tags: c.tags,
    }));

    return NextResponse.json({
      segment,
      customers,
    });
  } catch (error) {
    console.error("[API] GET /api/segments/[id]/customers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch segment customers" },
      { status: 500 }
    );
  }
}
