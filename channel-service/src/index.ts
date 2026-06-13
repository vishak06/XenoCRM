import express from "express";
import cors from "cors";
import { SendRequestSchema, simulateDelivery } from "./routes/send";

const app = express();
const PORT = process.env.PORT || 3001;
const CRM_CALLBACK_URL = process.env.CRM_CALLBACK_URL || "http://localhost:3000";

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "channel-service", timestamp: new Date().toISOString() });
});

/**
 * POST /send
 * Accepts a communication payload, responds immediately with { accepted: true },
 * then asynchronously simulates delivery outcomes and posts callbacks to the CRM.
 */
app.post("/send", (req, res) => {
  const parsed = SendRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      accepted: false,
      error: "Invalid payload",
      details: parsed.error.flatten(),
    });
    return;
  }

  const { communicationId, recipient, message, channel } = parsed.data;
  console.log(
    `[Received] ${channel} message for ${recipient} (comm: ${communicationId}) — "${message.substring(0, 50)}..."`
  );

  // Respond immediately
  res.json({ accepted: true });

  // Simulate async delivery lifecycle
  simulateDelivery(communicationId, CRM_CALLBACK_URL);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Channel Service running on port ${PORT}`);
  console.log(`📡 CRM callback URL: ${CRM_CALLBACK_URL}`);
});
