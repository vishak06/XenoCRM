import { genAI, MODEL_NAME } from "./client";
import { EXPLAIN_SEGMENT_INSTRUCTION } from "./prompts";
import { RuleDefinition } from "@/lib/segments/schema";

/**
 * Converts a segment rule JSON into a plain-English description using Gemini.
 * Returns a natural-sounding description string.
 */
export async function explainSegment(rule: RuleDefinition): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: EXPLAIN_SEGMENT_INSTRUCTION,
  });

  const prompt = `Explain this segment rule in plain English:
${JSON.stringify(rule, null, 2)}`;

  const result = await model.generateContent(prompt);
  const explanation = result.response.text().trim();

  if (!explanation) {
    throw new Error("Gemini returned an empty explanation");
  }

  return explanation;
}
