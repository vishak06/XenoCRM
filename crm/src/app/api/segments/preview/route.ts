import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { RuleDefinitionSchema, validateFieldOperatorCompatibility } from "@/lib/segments/schema";
import { ruleToPrismaWhere, filterByOrderCount } from "@/lib/segments/rule-to-prisma";

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

    const rule = ruleResult.data;

    // Validate field-operator compatibility
    const compatibility = validateFieldOperatorCompatibility(rule);
    if (!compatibility.valid) {
      return NextResponse.json(
        { error: "Invalid field-operator combinations", details: compatibility.errors },
        { status: 400 }
      );
    }

    // Convert to Prisma where clause
    const { where, orderCountConditions } = ruleToPrismaWhere(rule);

    // Query customers
    const allMatching = await prisma.customer.findMany({
      where,
      include: {
        _count: { select: { orders: true } },
        orders: {
          orderBy: { orderDate: "desc" },
          take: 1,
          select: { items: true },
        },
      },
    });

    // Apply orderCount post-filter if needed
    const filtered = filterByOrderCount(allMatching, orderCountConditions, rule.combinator);

    // Get total count and sample of 5
    const totalCount = filtered.length;
    const sample = filtered.slice(0, 5).map((c) => {
      const lastOrder = c.orders[0];
      const lastItems = lastOrder?.items as Array<{ name: string }> | undefined;
      const lastProduct = lastItems?.[0]?.name || null;

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        city: c.city,
        totalSpend: c.totalSpend,
        lastOrderDate: c.lastOrderDate,
        orderCount: c._count.orders,
        tags: c.tags,
        lastProduct,
      };
    });

    return NextResponse.json({
      totalCount,
      sample,
    });
  } catch (error) {
    console.error("[API] POST /api/segments/preview error:", error);
    return NextResponse.json(
      { error: "Failed to preview segment" },
      { status: 500 }
    );
  }
}
