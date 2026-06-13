import { z } from "zod";

// ============================================
// Segment Rule Schema — validated with Zod
// ============================================

export const ALLOWED_FIELDS = [
  "city",
  "totalSpend",
  "lastOrderDate",
  "tags",
  "orderCount",
] as const;

export const ALLOWED_OPERATORS = [
  "equals",
  "notEquals",
  "greaterThan",
  "lessThan",
  "olderThanDays",
  "withinDays",
  "contains",
] as const;

export type SegmentField = (typeof ALLOWED_FIELDS)[number];
export type SegmentOperator = (typeof ALLOWED_OPERATORS)[number];

export const ConditionSchema = z.object({
  field: z.enum(ALLOWED_FIELDS),
  operator: z.enum(ALLOWED_OPERATORS),
  value: z.union([z.string(), z.number()]),
});

export const RuleDefinitionSchema = z.object({
  combinator: z.enum(["AND", "OR"]),
  conditions: z.array(ConditionSchema).min(1),
});

export type Condition = z.infer<typeof ConditionSchema>;
export type RuleDefinition = z.infer<typeof RuleDefinitionSchema>;

// ============================================
// Field-Operator Compatibility Validation
// ============================================

const FIELD_OPERATOR_MAP: Record<SegmentField, SegmentOperator[]> = {
  city: ["equals", "notEquals"],
  totalSpend: ["greaterThan", "lessThan", "equals"],
  lastOrderDate: ["olderThanDays", "withinDays"],
  tags: ["contains"],
  orderCount: ["greaterThan", "lessThan", "equals"],
};

/**
 * Validates that each condition uses a compatible field-operator pair.
 */
export function validateFieldOperatorCompatibility(
  rule: RuleDefinition
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const condition of rule.conditions) {
    const allowedOps = FIELD_OPERATOR_MAP[condition.field];
    if (!allowedOps.includes(condition.operator)) {
      errors.push(
        `Operator "${condition.operator}" is not valid for field "${condition.field}". ` +
          `Allowed operators: ${allowedOps.join(", ")}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
