/**
 * Renders a message template by replacing personalization tokens
 * with actual customer data.
 * 
 * Supported tokens:
 * - {{name}} — Customer's full name
 * - {{city}} — Customer's city
 * - {{totalSpend}} — Customer's total spend (formatted in INR)
 * - {{lastProduct}} — Last purchased product name
 * - {{lastOrderDate}} — Last order date (formatted)
 * - {{email}} — Customer's email
 * - {{phone}} — Customer's phone
 */
export interface CustomerData {
  name: string;
  email: string;
  phone: string;
  city: string;
  totalSpend: number | string;
  lastOrderDate: Date | string | null;
  lastProduct?: string;
}

export function renderTemplate(
  template: string,
  customer: CustomerData
): string {
  const totalSpend =
    typeof customer.totalSpend === "string"
      ? parseFloat(customer.totalSpend)
      : customer.totalSpend;

  const formattedSpend = `₹${totalSpend.toLocaleString("en-IN")}`;

  let formattedDate = "N/A";
  if (customer.lastOrderDate) {
    const date =
      typeof customer.lastOrderDate === "string"
        ? new Date(customer.lastOrderDate)
        : customer.lastOrderDate;
    formattedDate = date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return template
    .replace(/\{\{name\}\}/g, customer.name)
    .replace(/\{\{city\}\}/g, customer.city)
    .replace(/\{\{totalSpend\}\}/g, formattedSpend)
    .replace(/\{\{lastProduct\}\}/g, customer.lastProduct || "your favorite items")
    .replace(/\{\{lastOrderDate\}\}/g, formattedDate)
    .replace(/\{\{email\}\}/g, customer.email)
    .replace(/\{\{phone\}\}/g, customer.phone);
}
