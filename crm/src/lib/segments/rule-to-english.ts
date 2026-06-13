import { RuleDefinition, Condition } from "./schema";

/**
 * Converts a single condition into a human-readable string.
 */
function conditionToEnglish(condition: Condition): string {
  const { field, operator, value } = condition;

  switch (field) {
    case "city":
      switch (operator) {
        case "equals":
          return `located in ${value}`;
        case "notEquals":
          return `not located in ${value}`;
        default:
          return `city ${operator} ${value}`;
      }

    case "totalSpend":
      const formattedAmount = `₹${Number(value).toLocaleString("en-IN")}`;
      switch (operator) {
        case "greaterThan":
          return `total spend greater than ${formattedAmount}`;
        case "lessThan":
          return `total spend less than ${formattedAmount}`;
        case "equals":
          return `total spend exactly ${formattedAmount}`;
        default:
          return `total spend ${operator} ${formattedAmount}`;
      }

    case "lastOrderDate":
      switch (operator) {
        case "olderThanDays":
          return `last order more than ${value} days ago`;
        case "withinDays":
          return `last order within the past ${value} days`;
        default:
          return `last order ${operator} ${value} days`;
      }

    case "tags":
      switch (operator) {
        case "contains":
          return `tagged as "${value}"`;
        default:
          return `tags ${operator} "${value}"`;
      }

    case "orderCount":
      switch (operator) {
        case "greaterThan":
          return `more than ${value} orders`;
        case "lessThan":
          return `fewer than ${value} orders`;
        case "equals":
          return `exactly ${value} orders`;
        default:
          return `order count ${operator} ${value}`;
      }

    default:
      return `${field} ${operator} ${value}`;
  }
}

/**
 * Converts a full RuleDefinition into a plain-English summary string.
 * 
 * Example output: 
 * "Customers located in Bangalore AND total spend greater than ₹10,000 AND last order more than 60 days ago"
 */
export function ruleToEnglish(rule: RuleDefinition): string {
  if (rule.conditions.length === 0) {
    return "All customers";
  }

  const parts = rule.conditions.map(conditionToEnglish);
  const connector = rule.combinator === "AND" ? " AND " : " OR ";

  return `Customers who are ${parts.join(connector)}`;
}
