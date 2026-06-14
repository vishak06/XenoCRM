import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { RuleDefinitionSchema } from "@/lib/segments/schema";
import { ruleToPrismaWhere, filterByOrderCount } from "@/lib/segments/rule-to-prisma";
import { renderTemplate, CustomerData } from "@/lib/dispatch/render-template";
import { z } from "zod";

const CreateCampaignSchema = z.object({
  name: z.string().min(1),
  segmentId: z.string().optional(),
  segmentRule: RuleDefinitionSchema,
  messageTemplate: z.string().min(1),
  channel: z.enum(["WHATSAPP", "SMS", "EMAIL", "RCS"]),
});

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { communicationLogs: true } },
        communicationLogs: {
          select: { status: true },
        },
      },
    });

    // Compute stats for each campaign
    const campaignsWithStats = campaigns.map((campaign) => {
      const logs = campaign.communicationLogs;
      const stats = {
        total: logs.length,
        queued: logs.filter((l) => l.status === "QUEUED").length,
        sent: logs.filter((l) => l.status === "SENT").length,
        delivered: logs.filter((l) => l.status === "DELIVERED").length,
        opened: logs.filter((l) => l.status === "OPENED").length,
        clicked: logs.filter((l) => l.status === "CLICKED").length,
        failed: logs.filter((l) => l.status === "FAILED").length,
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { communicationLogs, ...rest } = campaign;
      return { ...rest, stats };
    });

    return NextResponse.json({ campaigns: campaignsWithStats });
  } catch (error) {
    console.error("[API] GET /api/campaigns error:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = CreateCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid campaign data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, segmentId, segmentRule, messageTemplate, channel } = parsed.data;

    // 1. Create the campaign
    const campaign = await prisma.campaign.create({
      data: {
        name,
        segmentId: segmentId || null,
        segmentRuleSnapshot: segmentRule as any,
        messageTemplate,
        channel,
        status: "QUEUED",
      },
    });

    // 2. Find matching customers
    const { where, orderCountConditions } = ruleToPrismaWhere(segmentRule);
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

    const matchingCustomers = filterByOrderCount(
      allMatching,
      orderCountConditions,
      segmentRule.combinator
    );

    // 3. Create CommunicationLog rows with rendered messages
    const communicationLogs = matchingCustomers.map((customer) => {
      const lastOrder = customer.orders[0];
      const lastItems = lastOrder?.items as Array<{ name: string }> | undefined;
      const lastProduct = lastItems?.[0]?.name || undefined;

      const customerData: CustomerData = {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        city: customer.city,
        totalSpend: customer.totalSpend.toNumber(),
        lastOrderDate: customer.lastOrderDate,
        lastProduct,
      };

      const renderedMessage = renderTemplate(messageTemplate, customerData);

      return {
        campaignId: campaign.id,
        customerId: customer.id,
        renderedMessage,
        status: "QUEUED" as const,
      };
    });

    // Bulk create communication logs
    await prisma.communicationLog.createMany({
      data: communicationLogs,
    });

    return NextResponse.json(
      {
        campaign,
        recipientCount: communicationLogs.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] POST /api/campaigns error:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
