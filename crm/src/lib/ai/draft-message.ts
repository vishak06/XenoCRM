import { genAI, MODEL_NAME } from "./client";
import { DRAFT_MESSAGE_INSTRUCTION } from "./prompts";

interface DraftMessageInput {
  channel: string;
  tone: string;
  offerDescription: string;
  segmentDescription: string;
}

/**
 * Generates a message template with personalization tokens using Gemini.
 * Returns plain text (not JSON) since the output is a message template.
 */
export async function draftMessage(input: DraftMessageInput): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: DRAFT_MESSAGE_INSTRUCTION,
  });

  const prompt = `Draft a ${input.channel} message with the following details:
- Channel: ${input.channel}
- Tone: ${input.tone}
- Offer/Promotion: ${input.offerDescription}
- Target Audience: ${input.segmentDescription}

Write the message template using personalization tokens ({{name}}, {{city}}, {{totalSpend}}, {{lastProduct}}, {{lastOrderDate}}) where appropriate.`;

  const result = await model.generateContent(prompt);
  const messageTemplate = result.response.text().trim();

  if (!messageTemplate) {
    throw new Error("Gemini returned an empty message template");
  }

  return messageTemplate;
}
