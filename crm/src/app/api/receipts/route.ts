import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Status hierarchy: higher index = more advanced status (never downgrade)
const STATUS_HIERARCHY: Record<string, number> = {
  QUEUED: 0,
  SENT: 1,
  DELIVERED: 2,
  FAILED: 2, // FAILED is at same level as DELIVERED (terminal state)
  OPENED: 3,
  CLICKED: 4,
};

const ReceiptSchema = z.object({
  communicationId: z.string().min(1),
  status: z.enum(["SENT", "DELIVERED", "FAILED", "OPENED", "CLICKED"]),
  timestamp: z.string().datetime(),
  failureReason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate payload
    const parsed = ReceiptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid receipt payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { communicationId, status, timestamp, failureReason } = parsed.data;

    // Find existing communication log
    const existing = await prisma.communicationLog.findUnique({
      where: { id: communicationId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Communication log not found" },
        { status: 404 }
      );
    }

    // Idempotency check: don't downgrade status
    const currentLevel = STATUS_HIERARCHY[existing.status] ?? 0;
    const incomingLevel = STATUS_HIERARCHY[status] ?? 0;

    if (incomingLevel <= currentLevel && existing.status !== "QUEUED") {
      // Silently accept but don't update (idempotent)
      return NextResponse.json({
        acknowledged: true,
        updated: false,
        reason: `Current status ${existing.status} is at or above incoming status ${status}`,
      });
    }

    // Build update data based on status
    const updateData: Record<string, unknown> = {
      status,
    };

    const eventTimestamp = new Date(timestamp);

    switch (status) {
      case "SENT":
        updateData.sentAt = eventTimestamp;
        break;
      case "DELIVERED":
        updateData.deliveredAt = eventTimestamp;
        break;
      case "OPENED":
        updateData.openedAt = eventTimestamp;
        break;
      case "CLICKED":
        updateData.clickedAt = eventTimestamp;
        break;
      case "FAILED":
        updateData.failureReason = failureReason || "Unknown failure";
        break;
    }

    await prisma.communicationLog.update({
      where: { id: communicationId },
      data: updateData,
    });

    return NextResponse.json({
      acknowledged: true,
      updated: true,
    });
  } catch (error) {
    console.error("[API] POST /api/receipts error:", error);
    return NextResponse.json(
      { error: "Failed to process receipt" },
      { status: 500 }
    );
  }
}
