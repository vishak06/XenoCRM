import { Prisma } from "@prisma/client";
import { RuleDefinition, Condition } from "./schema";

/**
 * Converts a single condition into a Prisma where clause fragment.
 */
function conditionToPrisma(condition: Condition): Prisma.CustomerWhereInput {
  const { field, operator, value } = condition;

  switch (field) {
    case "city":
      switch (operator) {
        case "equals":
          return { city: String(value) };
        case "notEquals":
          return { city: { not: String(value) } };
        default:
          throw new Error(`Unsupported operator "${operator}" for field "city"`);
      }

    case "totalSpend":
      switch (operator) {
        case "greaterThan":
          return { totalSpend: { gt: Number(value) } };
        case "lessThan":
          return { totalSpend: { lt: Number(value) } };
        case "equals":
          return { totalSpend: { equals: Number(value) } };
        default:
          throw new Error(`Unsupported operator "${operator}" for field "totalSpend"`);
      }

    case "lastOrderDate": {
      const days = Number(value);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      switch (operator) {
        case "olderThanDays":
          // Last order is older than N days ago (or no order at all)
          return {
            OR: [
              { lastOrderDate: { lt: cutoffDate } },
              { lastOrderDate: null },
            ],
          };
        case "withinDays":
          // Last order is within the last N days
          return { lastOrderDate: { gte: cutoffDate } };
        default:
          throw new Error(`Unsupported operator "${operator}" for field "lastOrderDate"`);
      }
    }

    case "tags":
      switch (operator) {
        case "contains":
          return { tags: { has: String(value) } };
        default:
          throw new Error(`Unsupported operator "${operator}" for field "tags"`);
      }

    case "orderCount":
      switch (operator) {
        case "greaterThan":
          return { orders: { some: {} }, _count: undefined } as Prisma.CustomerWhereInput;
        case "lessThan":
        case "equals":
          // For orderCount filters, we'll need to use a raw approach
          // or handle it via having clause. For simplicity, we use a
          // post-filter or raw query approach.
          return {};
        default:
          throw new Error(`Unsupported operator "${operator}" for field "orderCount"`);
      }

    default:
      throw new Error(`Unknown field: "${field}"`);
  }
}

/**
 * Converts a full RuleDefinition into a Prisma CustomerWhereInput.
 * 
 * For orderCount conditions, we handle them separately since Prisma
 * doesn't directly support _count in where clauses for simple filtering.
 */
export function ruleToPrismaWhere(rule: RuleDefinition): {
  where: Prisma.CustomerWhereInput;
  orderCountConditions: Condition[];
} {
  const regularConditions: Prisma.CustomerWhereInput[] = [];
  const orderCountConditions: Condition[] = [];

  for (const condition of rule.conditions) {
    if (condition.field === "orderCount") {
      orderCountConditions.push(condition);
    } else {
      regularConditions.push(conditionToPrisma(condition));
    }
  }

  let where: Prisma.CustomerWhereInput = {};

  if (regularConditions.length > 0) {
    if (rule.combinator === "AND") {
      where = { AND: regularConditions };
    } else {
      where = { OR: regularConditions };
    }
  }

  return { where, orderCountConditions };
}

/**
 * Applies orderCount filtering as a post-query step.
 * 
 * This is needed because Prisma doesn't support _count in where clauses
 * for relation aggregates in a straightforward way. At scale, this would
 * be replaced with a raw SQL query using HAVING clauses.
 */
export function filterByOrderCount<
  T extends { _count?: { orders: number } | undefined }
>(customers: T[], conditions: Condition[], combinator: "AND" | "OR"): T[] {
  if (conditions.length === 0) return customers;

  return customers.filter((customer) => {
    const orderCount = customer._count?.orders ?? 0;

    const results = conditions.map((condition) => {
      switch (condition.operator) {
        case "greaterThan":
          return orderCount > Number(condition.value);
        case "lessThan":
          return orderCount < Number(condition.value);
        case "equals":
          return orderCount === Number(condition.value);
        default:
          return false;
      }
    });

    return combinator === "AND" ? results.every(Boolean) : results.some(Boolean);
  });
}
