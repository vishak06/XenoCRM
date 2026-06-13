import { genAI, MODEL_NAME } from "./client";
import { PARSE_INTENT_INSTRUCTION, PARSE_INTENT_SCHEMA } from "./prompts";
import { RuleDefinitionSchema } from "@/lib/segments/schema";
import { z } from "zod";

// Zod schema for validating the full parsed intent response
const ParsedIntentSchema = z.object({
  segment: RuleDefinitionSchema.extend({
    conditions: z.array(
      z.object({
        field: z.enum(["city", "totalSpend", "lastOrderDate", "tags", "orderCount"]),
        operator: z.enum([
          "equals", "notEquals", "greaterThan", "lessThan",
          "olderThanDays", "withinDays", "contains",
        ]),
        value: z.union([z.string(), z.number()]).transform((val) => {
          // Gemini returns strings due to schema constraints, convert numeric strings
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

export type ParsedIntent = z.infer<typeof ParsedIntentSchema>;

/**
 * Parses a natural language campaign description into a structured
 * segment definition and message intent using Gemini.
 */
export async function parseIntent(userMessage: string): Promise<ParsedIntent> {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: PARSE_INTENT_INSTRUCTION,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: PARSE_INTENT_SCHEMA,
    },
  });

  const result = await model.generateContent(userMessage);
  const responseText = result.response.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error(`Failed to parse Gemini response as JSON: ${responseText.substring(0, 200)}`);
  }

  const validated = ParsedIntentSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `Gemini response failed validation: ${JSON.stringify(validated.error.flatten())}`
    );
  }

  return validated.data;
}
