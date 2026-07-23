import type { Prisma } from "@prisma/client";
import { z } from "zod";
import type { ActionItemDto, DirectiveDetail, DataHealth } from "@artixio/shared";

const now = new Date("2026-07-23T09:00:00.000Z");
const supportedSchemaVersion = "2026.1";

const payloadValidationSchema = z.object({
  schemaVersion: z.string(),
  source: z.object({
    bulletinId: z.string(),
    publishedAt: z.string().datetime(),
    url: z.string().url().optional()
  }),
  metadata: z.object({
    extractedAt: z.string().datetime().optional(),
    model: z.string().optional(),
    confidence: z.number().optional()
  }),
  impactedProducts: z.array(z.string()).default([]),
  geography: z.array(z.string()).default([]),
  fullText: z.string().optional()
}).passthrough();

type DirectiveRecord = Prisma.ComplianceDirectiveGetPayload<{
  include: {
    authority: true;
    actionItems: true;
  };
}>;

function toIsoString(date: Date | null) {
  return date ? date.toISOString() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function priorityRank(priority: ActionItemDto["priority"]) {
  return {
    URGENT: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3
  }[priority];
}

function statusRank(status: ActionItemDto["status"]) {
  return {
    PENDING: 0,
    IN_REVIEW: 1,
    REJECTED: 2,
    RESOLVED: 3
  }[status];
}

function sanitizePayload(rawPayload: Prisma.JsonValue) {
  const anomalies: string[] = [];
  let payload: Record<string, unknown> = {
    schemaVersion: supportedSchemaVersion,
    source: {
      bulletinId: "Unknown",
      publishedAt: now.toISOString()
    },
    metadata: {
      model: "Unknown"
    },
    impactedProducts: [],
    geography: [],
    fullText: "Payload content unavailable."
  };

  if (!isRecord(rawPayload)) {
    anomalies.push("Malformed payload: payload is not an object");
    return { payload, anomalies, payloadCorrupt: true };
  }

  if (!("metadata" in rawPayload) || !isRecord(rawPayload.metadata)) {
    anomalies.push("Malformed payload: missing metadata");
  }

  if (rawPayload.schemaVersion !== supportedSchemaVersion) {
    anomalies.push("Malformed payload: unsupported schema version");
  }

  if (!("source" in rawPayload) || !isRecord(rawPayload.source) || typeof rawPayload.source.bulletinId !== "string") {
    anomalies.push("Malformed payload: missing source metadata");
  }

  const parsedPayload = payloadValidationSchema.safeParse(rawPayload);

  if (parsedPayload.success) {
    payload = {
      schemaVersion: parsedPayload.data.schemaVersion,
      source: parsedPayload.data.source,
      metadata: parsedPayload.data.metadata,
      impactedProducts: parsedPayload.data.impactedProducts,
      geography: parsedPayload.data.geography,
      fullText: parsedPayload.data.fullText ?? "Payload content unavailable."
    };
  } else {
    payload = {
      ...payload,
      ...rawPayload
    };
  }

  return {
    payload,
    anomalies,
    payloadCorrupt: anomalies.length > 0
  };
}

function sanitizeActionItems(record: DirectiveRecord) {
  const anomalies: string[] = [];

  const actionItems: ActionItemDto[] = record.actionItems.map((actionItem) => {
    if (!actionItem.dueDate) {
      anomalies.push("Missing mandatory due date");
    }

    if (
      actionItem.status === "RESOLVED" &&
      actionItem.dueDate &&
      actionItem.dueDate < now &&
      !actionItem.flagReason
    ) {
      anomalies.push("Conflicting state: resolved item is overdue without resolution notes");
    }

    return {
      id: actionItem.id,
      directiveId: actionItem.directiveId,
      title: actionItem.title || "Unknown action item",
      assignedTo: actionItem.assignedTo || "Unassigned",
      status: actionItem.status,
      priority: actionItem.priority,
      dueDate: toIsoString(actionItem.dueDate),
      flagReason: actionItem.flagReason ?? null
    };
  });

  actionItems.sort((left, right) => {
    const statusDelta = statusRank(left.status) - statusRank(right.status);
    if (statusDelta !== 0) return statusDelta;

    const priorityDelta = priorityRank(left.priority) - priorityRank(right.priority);
    if (priorityDelta !== 0) return priorityDelta;

    if (!left.dueDate && !right.dueDate) return 0;
    if (!left.dueDate) return 1;
    if (!right.dueDate) return -1;

    return left.dueDate.localeCompare(right.dueDate);
  });

  return {
    actionItems,
    anomalies
  };
}

export function normalizeDirective(record: DirectiveRecord): DirectiveDetail {
  const anomalies: string[] = [];

  if (!record.effectiveDate) {
    anomalies.push("Missing effective date");
  }

  const { actionItems, anomalies: actionItemAnomalies } = sanitizeActionItems(record);
  anomalies.push(...actionItemAnomalies);

  const { payload, anomalies: payloadAnomalies, payloadCorrupt } = sanitizePayload(record.rawPayload);
  anomalies.push(...payloadAnomalies);

  const health: DataHealth = payloadCorrupt
    ? "CORRUPT_PAYLOAD"
    : anomalies.length > 0
      ? "ANOMALY"
      : "CLEAN";

  return {
    id: record.id,
    title: record.title || "Unknown directive",
    summary: record.summary || "No summary available.",
    riskLevel: record.riskLevel,
    effectiveDate: toIsoString(record.effectiveDate),
    authority: {
      id: record.authority.id,
      code: record.authority.code,
      name: record.authority.name || "Unknown",
      region: record.authority.region || "Unknown",
      website: record.authority.website
    },
    hasAnomaly: anomalies.length > 0,
    health,
    anomalies,
    primaryActionItem: actionItems[0] ?? null,
    actionItems,
    rawPayload: payload
  };
}

export function createDirectiveMeta(record: DirectiveRecord) {
  const normalized = normalizeDirective(record);

  return {
    directiveId: normalized.id,
    health: normalized.health,
    hasAnomaly: normalized.hasAnomaly,
    anomalies: normalized.anomalies,
    primaryActionItem: normalized.primaryActionItem,
    actionItems: normalized.actionItems
  };
}

