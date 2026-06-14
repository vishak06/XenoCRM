import { genAI, MODEL_NAME } from "./client";
import { ANALYTICS_SUMMARY_INSTRUCTION } from "./prompts";

interface AnalyticsSummaryInput {
  totalCustomers: number;
  totalRevenue: number;
  totalOrders: number;
  emailsSent: number;
  emailsOpened: number;
  revenueByMonth: { name: string; revenue: number }[];
  topProducts: { name: string; revenue: number }[];
  segmentsData: { name: string; value: number }[];
}

/**
 * Generates an AI-powered executive summary of the analytics dashboard.
 */
export async function generateAnalyticsSummary(data: AnalyticsSummaryInput): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: ANALYTICS_SUMMARY_INSTRUCTION,
  });

  const avgOrderValue = data.totalOrders > 0 ? Math.round(data.totalRevenue / data.totalOrders) : 0;
  const revenuePerCustomer = data.totalCustomers > 0 ? Math.round(data.totalRevenue / data.totalCustomers) : 0;
  const openRate = data.emailsSent > 0 ? Math.round((data.emailsOpened / data.emailsSent) * 100) : 0;

  const prompt = `Analyze this CRM dashboard data:

**Key Metrics:**
- Total Customers: ${data.totalCustomers.toLocaleString("en-IN")}
- Total Revenue: ₹${data.totalRevenue.toLocaleString("en-IN")}
- Total Orders: ${data.totalOrders.toLocaleString("en-IN")}
- Average Order Value: ₹${avgOrderValue.toLocaleString("en-IN")}
- Revenue per Customer: ₹${revenuePerCustomer.toLocaleString("en-IN")}
- Campaign Messages Sent: ${data.emailsSent.toLocaleString("en-IN")}
- Campaign Open Rate: ${openRate}%

**Revenue Trend (Last 6 Months):**
${data.revenueByMonth.map((m) => `- ${m.name}: ₹${m.revenue.toLocaleString("en-IN")}`).join("\n")}

**Top Products by Revenue:**
${data.topProducts.map((p, i) => `${i + 1}. ${p.name}: ₹${p.revenue.toLocaleString("en-IN")}`).join("\n")}

**Customer Segments:**
${data.segmentsData.map((s) => `- ${s.name}: ${s.value} customers`).join("\n")}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  if (!text) {
    throw new Error("Gemini returned empty analytics summary");
  }

  return text;
}
