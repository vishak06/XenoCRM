import { genAI, MODEL_NAME } from "./client";
import { REFINE_SEGMENT_INSTRUCTION, REFINE_INTENT_SCHEMA } from "./prompts";
import { RuleDefinition, RuleDefinitionSchema } from "@/lib/segments/schema";
import { z } from "zod";

interface ConversationMessage {
  role: "user" | "model";
  content: string;
}

const RefinedIntentSchema = z.object({
  segment: RuleDefinitionSchema.extend({
    conditions: z.array(
      z.object({
        field: z.enum(["city", "totalSpend", "lastOrderDate", "tags", "orderCount"]),
        operator: z.enum([
          "equals", "notEquals", "greaterThan", "lessThan",
          "olderThanDays", "withinDays", "contains",
        ]),
        value: z.union([z.string(), z.number()]).transform((val) => {
          if (typeof val === "string" && !isNaN(Number(val)) && val.trim() !== "") {
            return Number(val);
          }
          return val;
        }),
      })
    ),
  }),
  messageIntent: z.object({
    channel: z.enum(["WHATSAPP", "SMS", "EMAIL", "RCS"]),
    tone: z.string(),
    offerDescription: z.string(),
  }),
});

export type RefinedIntent = z.infer<typeof RefinedIntentSchema>;

/**
 * Refines an existing segment based on conversation history and a follow-up message.
 * Maintains multi-turn context by passing previous messages to Gemini.
 */
export async function refineSegment(
  currentSegment: RuleDefinition,
  messageIntent: { channel: string; tone: string; offerDescription: string },
  refinementMessage: string,
  conversationHistory: ConversationMessage[]
): Promise<RefinedIntent> {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: REFINE_SEGMENT_INSTRUCTION,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: REFINE_INTENT_SCHEMA,
    },
  });

  // Build the conversation context
  const contextMessage = `Current segment rule:
${JSON.stringify(currentSegment, null, 2)}

Current message intent:
${JSON.stringify(messageIntent, null, 2)}

User's refinement request: ${refinementMessage}`;

  // Use multi-turn chat for context
  const history = conversationHistory.map((msg) => ({
    role: msg.role as "user" | "model",
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(contextMessage);
  const responseText = result.response.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error(`Failed to parse Gemini response as JSON: ${responseText.substring(0, 200)}`);
  }

  const validated = RefinedIntentSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `Gemini refinement response failed validation: ${JSON.stringify(validated.error.flatten())}`
    );
  }

  return validated.data;
}
