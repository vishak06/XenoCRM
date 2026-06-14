import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCustomerInsights } from "@/lib/ai/customer-insights";
import { ruleToPrismaWhere, filterByOrderCount } from "@/lib/segments/rule-to-prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: "customerId is required" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        orders: {
          orderBy: { orderDate: "desc" },
          take: 10,
        },
        _count: {
          select: { orders: true }
        }
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Evaluate which segments the customer belongs to
    const allSegments = await prisma.segment.findMany();
    const customerSegments: string[] = [];
    
    for (const segment of allSegments) {
      const rule = segment.ruleDefinition as any;
      const { where, orderCountConditions } = ruleToPrismaWhere(rule);
      
      // Check if customer matches basic where clause (we just query this single customer with the where clause)
      const matchesWhere = await prisma.customer.findFirst({
        where: {
          id: customer.id,
          AND: where
        }
      });
      
      if (matchesWhere) {
        // Evaluate order count conditions
        const filtered = filterByOrderCount([customer], orderCountConditions, rule.combinator);
        if (filtered.length > 0) {
          customerSegments.push(segment.name);
        }
      }
    }

    const insights = await generateCustomerInsights({
      name: customer.name,
      email: customer.email,
      city: customer.city,
      totalSpend: Number(customer.totalSpend),
      lastOrderDate: customer.lastOrderDate?.toISOString() || null,
      segments: customerSegments,
      orders: customer.orders.map((o) => ({
        amount: Number(o.amount),
        orderDate: o.orderDate.toISOString(),
        items: o.items as { name: string; qty: number; price: number }[],
      })),
    });

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("[API] POST /api/ai/customer-insights error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate insights";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
