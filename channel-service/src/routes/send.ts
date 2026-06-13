import { z } from "zod";

// Validation schema for incoming send requests
export const SendRequestSchema = z.object({
  communicationId: z.string().min(1),
  recipient: z.string().min(1),
  message: z.string().min(1),
  channel: z.enum(["WHATSAPP", "SMS", "EMAIL", "RCS"]),
});

export type SendRequest = z.infer<typeof SendRequestSchema>;

// Status hierarchy for delivery simulation
export type DeliveryStatus = "SENT" | "DELIVERED" | "FAILED" | "OPENED" | "CLICKED";

// Failure reasons for simulation
const FAILURE_REASONS = [
  "Invalid phone number",
  "Recipient opted out",
  "Provider error: rate limit exceeded",
  "Provider error: service unavailable",
  "Invalid email address",
  "Message rejected by carrier",
];

function getRandomDelay(minMs: number, maxMs: number): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

function getRandomFailureReason(): string {
  return FAILURE_REASONS[Math.floor(Math.random() * FAILURE_REASONS.length)];
}

/**
 * Posts a delivery status callback to the CRM's /api/receipts endpoint.
 */
async function postCallback(
  callbackUrl: string,
  communicationId: string,
  status: DeliveryStatus,
  failureReason?: string
): Promise<void> {
  try {
    const body: Record<string, unknown> = {
      communicationId,
      status,
      timestamp: new Date().toISOString(),
    };
    if (failureReason) {
      body.failureReason = failureReason;
    }

    const response = await fetch(`${callbackUrl}/api/receipts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(
        `[Callback] Failed to post ${status} for ${communicationId}: ${response.status} ${response.statusText}`
      );
    } else {
      console.log(`[Callback] Posted ${status} for ${communicationId}`);
    }
  } catch (error) {
    console.error(`[Callback] Error posting ${status} for ${communicationId}:`, error);
  }
}

/**
 * Simulates the asynchronous delivery lifecycle of a message.
 * 
 * 85% chance: DELIVERED → 45% of those: OPENED → 20% of those: CLICKED
 * 15% chance: FAILED (with a simulated reason)
 * 
 * Each status transition has a randomized delay (3-20s).
 */
export function simulateDelivery(
  communicationId: string,
  callbackUrl: string
): void {
  const initialDelay = getRandomDelay(3000, 20000);

  setTimeout(async () => {
    const isDelivered = Math.random() < 0.85;

    if (!isDelivered) {
      // 15% → FAILED
      const reason = getRandomFailureReason();
      console.log(`[Sim] ${communicationId} → FAILED: ${reason}`);
      await postCallback(callbackUrl, communicationId, "FAILED", reason);
      return;
    }

    // 85% → DELIVERED
    console.log(`[Sim] ${communicationId} → DELIVERED`);
    await postCallback(callbackUrl, communicationId, "DELIVERED");

    // 45% of delivered → OPENED (after further delay)
    const willOpen = Math.random() < 0.45;
    if (!willOpen) return;

    const openDelay = getRandomDelay(3000, 15000);
    setTimeout(async () => {
      console.log(`[Sim] ${communicationId} → OPENED`);
      await postCallback(callbackUrl, communicationId, "OPENED");

      // 20% of opened → CLICKED (after further delay)
      const willClick = Math.random() < 0.20;
      if (!willClick) return;

      const clickDelay = getRandomDelay(2000, 10000);
      setTimeout(async () => {
        console.log(`[Sim] ${communicationId} → CLICKED`);
        await postCallback(callbackUrl, communicationId, "CLICKED");
      }, clickDelay);
    }, openDelay);
  }, initialDelay);
}
