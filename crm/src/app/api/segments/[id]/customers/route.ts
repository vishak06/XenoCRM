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

    // Get ALL segments so we can see which ones these customers belong to
    const allSegments = await prisma.segment.findMany();

    const customerIds = filtered.map(c => c.id);
    const customerSegments: Record<string, string[]> = {};
    for (const id of customerIds) {
      customerSegments[id] = [];
    }

    await Promise.all(allSegments.map(async (seg) => {
      const segRule = seg.ruleDefinition as any;
      const { where: segWhere, orderCountConditions: segOrderCount } = ruleToPrismaWhere(segRule);
      
      const matchingCustomers = await prisma.customer.findMany({
        where: {
          ...segWhere,
          id: { in: customerIds }
        },
        include: {
          _count: { select: { orders: true } }
        }
      });

      const segFiltered = filterByOrderCount(matchingCustomers, segOrderCount, segRule.combinator);
      for (const c of segFiltered) {
        customerSegments[c.id].push(seg.name);
      }
    }));

    const customers = filtered.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      city: c.city,
      totalSpend: c.totalSpend,
      lastOrderDate: c.lastOrderDate,
      orderCount: c._count.orders,
      segments: customerSegments[c.id] || [],
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
