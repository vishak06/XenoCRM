import { GoogleGenerativeAI } from "@google/generative-ai";

const globalForGenAI = globalThis as unknown as {
  genAI: GoogleGenerativeAI | undefined;
};

if (!globalForGenAI.genAI) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️  GEMINI_API_KEY not set — AI features will not work");
  }
  globalForGenAI.genAI = new GoogleGenerativeAI(apiKey || "");
}

export const genAI = globalForGenAI.genAI;

export const MODEL_NAME = "gemini-2.0-flash";
