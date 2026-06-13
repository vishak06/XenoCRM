import { prisma } from "@/lib/prisma";
import { CommunicationStatus } from "@prisma/client";

const BATCH_SIZE = 10;
const MAX_RETRIES = 3;
const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || "http://localhost:3001";

interface DispatchResult {
  total: number;
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Dispatches queued communication log entries for a campaign in batches.
 * 
 * 1. Fetches QUEUED rows in batches of BATCH_SIZE
 * 2. For each, marks as SENT and POSTs to Channel Service /send
 * 3. Retries up to MAX_RETRIES on failure, then marks FAILED
 * 4. Updates campaign status: SENDING → COMPLETED when done
 */
export async function dispatchCampaign(campaignId: string): Promise<DispatchResult> {
  const result: DispatchResult = { total: 0, sent: 0, failed: 0, errors: [] };

  // Update campaign status to SENDING
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "SENDING" },
  });

  // Process in batches
  let hasMore = true;

  while (hasMore) {
    const batch = await prisma.communicationLog.findMany({
      where: {
        campaignId,
        status: "QUEUED" as CommunicationStatus,
      },
      take: BATCH_SIZE,
      include: {
        customer: {
          select: { phone: true, email: true },
        },
        campaign: {
          select: { channel: true },
        },
      },
    });

    if (batch.length === 0) {
      hasMore = false;
      break;
    }

    result.total += batch.length;

    for (const log of batch) {
      let success = false;
      let lastError = "";

      // Determine recipient based on channel
      const recipient =
        log.campaign.channel === "EMAIL"
          ? log.customer.email
          : log.customer.phone;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          // Mark as SENT before calling channel service
          await prisma.communicationLog.update({
            where: { id: log.id },
            data: {
              status: "SENT",
              sentAt: new Date(),
            },
          });

          // POST to Channel Service
          const response = await fetch(`${CHANNEL_SERVICE_URL}/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              communicationId: log.id,
              recipient,
              message: log.renderedMessage,
              channel: log.campaign.channel,
            }),
          });

          if (!response.ok) {
            throw new Error(`Channel service returned ${response.status}`);
          }

          const body = await response.json();
          if (!body.accepted) {
            throw new Error("Channel service rejected the message");
          }

          success = true;
          result.sent++;
          break;
        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error);
          console.error(
            `[Dispatch] Attempt ${attempt}/${MAX_RETRIES} failed for ${log.id}: ${lastError}`
          );

          // Wait before retrying (exponential backoff)
          if (attempt < MAX_RETRIES) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * Math.pow(2, attempt - 1))
            );
          }
        }
      }

      if (!success) {
        // Mark as FAILED after all retries exhausted
        await prisma.communicationLog.update({
          where: { id: log.id },
          data: {
            status: "FAILED",
            failureReason: `Dispatch failed after ${MAX_RETRIES} retries: ${lastError}`,
          },
        });
        result.failed++;
        result.errors.push(`${log.id}: ${lastError}`);
      }
    }
  }

  // Update campaign status to COMPLETED
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "COMPLETED" },
  });

  return result;
}
