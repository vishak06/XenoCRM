import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAnalyticsSummary } from "@/lib/ai/analytics-summary";
import { ruleToPrismaWhere, filterByOrderCount } from "@/lib/segments/rule-to-prisma";

export async function POST() {
  try {
    const [totalCustomers, orders, logs, segments] = await Promise.all([
      prisma.customer.count(),
      prisma.order.findMany(),
      prisma.communicationLog.findMany(),
      prisma.segment.findMany(),
    ]);

    // Metrics
    let totalRevenue = 0;
    for (const order of orders) {
      totalRevenue += Number(order.amount);
    }

    let emailsSent = 0;
    let emailsOpened = 0;
    for (const log of logs) {
      if (["SENT", "DELIVERED", "OPENED", "CLICKED"].includes(log.status)) {
        emailsSent++;
      }
      if (["OPENED", "CLICKED"].includes(log.status)) {
        emailsOpened++;
      }
    }

    // Revenue by month
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueByMonth: Record<string, number> = {};
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      revenueByMonth[`${monthNames[d.getMonth()]} ${d.getFullYear()}`] = 0;
    }
    for (const order of orders) {
      const d = new Date(order.orderDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (revenueByMonth[key] !== undefined) {
        revenueByMonth[key] += Number(order.amount);
      }
    }

    // Top products
    const productSales: Record<string, number> = {};
    for (const order of orders) {
      const items = order.items as Array<{ name: string; qty: number; price: number }>;
      for (const item of items) {
        if (!productSales[item.name]) productSales[item.name] = 0;
        productSales[item.name] += item.qty * item.price;
      }
    }
    const topProducts = Object.entries(productSales)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Segments data
    const segmentsData = await Promise.all(
      segments.map(async (segment) => {
        const rule = segment.ruleDefinition as any;
        const { where, orderCountConditions } = ruleToPrismaWhere(rule);
        const matchingCustomers = await prisma.customer.findMany({
          where,
          include: { _count: { select: { orders: true } } },
        });
        const filtered = filterByOrderCount(matchingCustomers, orderCountConditions, rule.combinator);
        return { name: segment.name, value: filtered.length };
      })
    );

    const revenueGraph = Object.entries(revenueByMonth).map(([name, revenue]) => ({
      name,
      revenue,
    }));

    const summary = await generateAnalyticsSummary({
      totalCustomers,
      totalRevenue,
      totalOrders: orders.length,
      emailsSent,
      emailsOpened,
      revenueByMonth: revenueGraph,
      topProducts,
      segmentsData,
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("[API] POST /api/ai/analytics-summary error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate summary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
