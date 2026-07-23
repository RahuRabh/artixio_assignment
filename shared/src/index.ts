import { z } from "zod";

export const riskLevelValues = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const actionStatusValues = ["PENDING", "IN_REVIEW", "RESOLVED", "REJECTED"] as const;
export const priorityValues = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const dataHealthValues = ["CLEAN", "ANOMALY", "CORRUPT_PAYLOAD"] as const;

export const riskLevelSchema = z.enum(riskLevelValues);
export const actionStatusSchema = z.enum(actionStatusValues);
export const prioritySchema = z.enum(priorityValues);
export const dataHealthSchema = z.enum(dataHealthValues);

export type RiskLevel = z.infer<typeof riskLevelSchema>;
export type ActionStatus = z.infer<typeof actionStatusSchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type DataHealth = z.infer<typeof dataHealthSchema>;

const booleanFromQuery = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return false;
}, z.boolean());

export const directiveFiltersSchema = z.object({
  search: z.string().trim().default(""),
  riskLevel: riskLevelSchema.optional(),
  status: actionStatusSchema.optional(),
  authorityCode: z.string().trim().optional(),
  anomaliesOnly: booleanFromQuery.default(false),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12)
});

export type DirectiveFilters = z.infer<typeof directiveFiltersSchema>;

export const authoritySummarySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  region: z.string(),
  website: z.string().url()
});

export const actionItemDtoSchema = z.object({
  id: z.string(),
  directiveId: z.string(),
  title: z.string(),
  assignedTo: z.string(),
  status: actionStatusSchema,
  priority: prioritySchema,
  dueDate: z.string().datetime().nullable(),
  flagReason: z.string().nullable()
});

export const payloadSchema = z.record(z.string(), z.unknown());

export const directiveListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  riskLevel: riskLevelSchema,
  effectiveDate: z.string().datetime().nullable(),
  authority: authoritySummarySchema,
  hasAnomaly: z.boolean(),
  health: dataHealthSchema,
  anomalies: z.array(z.string()),
  primaryActionItem: actionItemDtoSchema.nullable(),
  actionItems: z.array(actionItemDtoSchema),
  rawPayload: payloadSchema
});

export const directiveDetailSchema = directiveListItemSchema;

export const analyticsSummarySchema = z.object({
  totalDirectives: z.number().int().nonnegative(),
  pendingActionItems: z.number().int().nonnegative(),
  highCriticalDirectives: z.number().int().nonnegative(),
  flaggedAnomalies: z.number().int().nonnegative()
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().min(0)
  });

export const actionStatusUpdateBodySchema = z.object({
  status: actionStatusSchema
});

export const directiveMetaSchema = z.object({
  directiveId: z.string(),
  health: dataHealthSchema,
  hasAnomaly: z.boolean(),
  anomalies: z.array(z.string()),
  primaryActionItem: actionItemDtoSchema.nullable(),
  actionItems: z.array(actionItemDtoSchema)
});

export const actionStatusUpdateResponseSchema = z.object({
  actionItem: actionItemDtoSchema,
  directive: directiveMetaSchema
});

export const filterOptionsSchema = z.object({
  authorities: z.array(authoritySummarySchema),
  riskLevels: z.array(riskLevelSchema),
  statuses: z.array(actionStatusSchema)
});

export type AuthoritySummary = z.infer<typeof authoritySummarySchema>;
export type ActionItemDto = z.infer<typeof actionItemDtoSchema>;
export type DirectiveListItem = z.infer<typeof directiveListItemSchema>;
export type DirectiveDetail = z.infer<typeof directiveDetailSchema>;
export type AnalyticsSummaryDto = z.infer<typeof analyticsSummarySchema>;
export type ActionStatusUpdateResponse = z.infer<typeof actionStatusUpdateResponseSchema>;
export type FilterOptionsDto = z.infer<typeof filterOptionsSchema>;

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export const allowedStatusTransitions: Record<ActionStatus, ActionStatus[]> = {
  PENDING: ["IN_REVIEW", "REJECTED"],
  IN_REVIEW: ["RESOLVED", "REJECTED"],
  RESOLVED: [],
  REJECTED: []
};

