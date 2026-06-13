import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        segment: { select: { name: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Aggregate stats
    const logs = await prisma.communicationLog.findMany({
      where: { campaignId: id },
      select: { status: true },
    });

    const stats = {
      total: logs.length,
      queued: logs.filter((l) => l.status === "QUEUED").length,
      sent: logs.filter((l) => l.status === "SENT").length,
      delivered: logs.filter((l) => l.status === "DELIVERED").length,
      opened: logs.filter((l) => l.status === "OPENED").length,
      clicked: logs.filter((l) => l.status === "CLICKED").length,
      failed: logs.filter((l) => l.status === "FAILED").length,
    };

    // Get individual logs with customer info
    const detailedLogs = await prisma.communicationLog.findMany({
      where: { campaignId: id },
      include: {
        customer: {
          select: { name: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      campaign,
      stats,
      logs: detailedLogs,
    });
  } catch (error) {
    console.error("[API] GET /api/campaigns/[id]/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign stats" },
      { status: 500 }
    );
  }
}
