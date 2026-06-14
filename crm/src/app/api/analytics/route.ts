import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ruleToPrismaWhere, filterByOrderCount } from "@/lib/segments/rule-to-prisma";

export async function GET() {
  try {
    const totalCustomers = await prisma.customer.count();
    const orders = await prisma.order.findMany();
    const logs = await prisma.communicationLog.findMany();
    const segments = await prisma.segment.findMany();

    // 1. Key Metrics
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

    const metrics = {
      totalCustomers,
      totalRevenue,
      totalOrders: orders.length,
      emailsSent
    };

    // 2. Revenue Graph Data (Last 6 months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueByMonth: Record<string, number> = {};
    
    // Initialize last 6 months
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

    const revenueGraph = Object.entries(revenueByMonth).map(([name, revenue]) => ({
      name,
      revenue
    }));

    // 3. Email Stats
    const emailStats = [
      { name: "Opened", value: emailsOpened, color: "#10b981" },
      { name: "Unopened", value: emailsSent - emailsOpened, color: "#f43f5e" }
    ];

    // 4. Top Products
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

    // 5. Segments Data
    const segmentsData = [];
    for (const segment of segments) {
      const rule = segment.ruleDefinition as any;
      const { where, orderCountConditions } = ruleToPrismaWhere(rule);
      
      const matchingCustomers = await prisma.customer.findMany({
        where,
        include: {
          _count: { select: { orders: true } }
        }
      });
      const filtered = filterByOrderCount(matchingCustomers, orderCountConditions, rule.combinator);
      segmentsData.push({
        name: segment.name,
        value: filtered.length
      });
    }

    // 6. Recent Activities
    const recentOrders = await prisma.order.findMany({ orderBy: { orderDate: 'desc' }, take: 5, include: { customer: { select: { name: true } } } });
    const recentCustomers = await prisma.customer.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
    const recentCampaigns = await prisma.campaign.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });

    const activities: any[] = [];
    for (const o of recentOrders) {
      activities.push({ id: `o-${o.id}`, type: 'order', title: `New Order: ₹${Number(o.amount).toLocaleString('en-IN')}`, description: `Placed by ${o.customer?.name || 'Unknown'}`, timestamp: o.orderDate });
    }
    for (const c of recentCustomers) {
      activities.push({ id: `c-${c.id}`, type: 'customer', title: 'New Customer', description: `${c.name} joined`, timestamp: c.createdAt });
    }
    for (const cmp of recentCampaigns) {
      activities.push({ id: `cmp-${cmp.id}`, type: 'campaign', title: 'Campaign Created', description: cmp.name, timestamp: cmp.createdAt });
    }
    
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const recentActivities = activities.slice(0, 10);

    return NextResponse.json({
      metrics,
      revenueGraph,
      emailStats,
      topProducts,
      segmentsData,
      recentActivities
    });

  } catch (error) {
    console.error("[API] GET /api/analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
