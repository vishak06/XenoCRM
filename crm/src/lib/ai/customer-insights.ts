import { genAI, MODEL_NAME } from "./client";
import { CUSTOMER_INSIGHTS_INSTRUCTION } from "./prompts";

interface CustomerData {
  name: string;
  email: string;
  city: string;
  totalSpend: number;
  lastOrderDate: string | null;
  segments: string[];
  orders: {
    amount: number;
    orderDate: string;
    items: { name: string; qty: number; price: number }[];
  }[];
}

/**
 * Generates AI-powered insights and next-best-action recommendations for a customer.
 */
export async function generateCustomerInsights(customer: CustomerData): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: CUSTOMER_INSIGHTS_INSTRUCTION,
  });

  const prompt = `Analyze this customer:

**Customer Profile:**
- Name: ${customer.name}
- Email: ${customer.email}
- City: ${customer.city}
- Total Spend: ₹${customer.totalSpend.toLocaleString("en-IN")}
- Last Order Date: ${customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString("en-IN") : "Never ordered"}
- Segments: ${customer.segments.length > 0 ? customer.segments.join(", ") : "None"}

**Order History (${customer.orders.length} orders):**
${customer.orders.length > 0
    ? customer.orders
        .slice(0, 10)
        .map(
          (o, i) =>
            `${i + 1}. ₹${Number(o.amount).toLocaleString("en-IN")} on ${new Date(o.orderDate).toLocaleDateString("en-IN")} — Items: ${(o.items as any[]).map((it) => `${it.name} (x${it.qty})`).join(", ")}`
        )
        .join("\n")
    : "No orders yet."}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  if (!text) {
    throw new Error("Gemini returned empty insights");
  }

  return text;
}
