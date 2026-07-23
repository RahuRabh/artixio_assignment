import { actionStatusValues, directiveFiltersSchema, riskLevelValues } from "@artixio/shared";
import type { DirectiveFilters } from "@artixio/shared";
import { prisma } from "../../lib/prisma.js";
import { paginate } from "../../lib/pagination.js";
import { createDirectiveMeta, normalizeDirective } from "./normalize.js";

export async function listDirectives(input: unknown) {
  const filters = directiveFiltersSchema.parse(input);
  const where = buildDirectiveWhere(filters);

  const directives = await prisma.complianceDirective.findMany({
    where,
    include: {
      authority: true,
      actionItems: true
    },
    orderBy: [
      {
        riskLevel: "desc"
      },
      {
        effectiveDate: "asc"
      }
    ]
  });

  const normalized = directives.map(normalizeDirective);
  const filtered = filters.anomaliesOnly
    ? normalized.filter((directive) => directive.hasAnomaly)
    : normalized;

  return paginate(filtered, filters.page, filters.pageSize);
}

export async function getAnalyticsSummary() {
  const directives = await prisma.complianceDirective.findMany({
    include: {
      authority: true,
      actionItems: true
    }
  });

  const normalized = directives.map(normalizeDirective);
  const pendingActionItems = normalized.flatMap((directive) => directive.actionItems)
    .filter((actionItem) => actionItem.status === "PENDING").length;
  const highCriticalDirectives = normalized
    .filter((directive) => directive.riskLevel === "HIGH" || directive.riskLevel === "CRITICAL").length;
  const flaggedAnomalies = normalized.filter((directive) => directive.hasAnomaly).length;

  return {
    totalDirectives: normalized.length,
    pendingActionItems,
    highCriticalDirectives,
    flaggedAnomalies
  };
}

export async function getFilterOptions() {
  const authorities = await prisma.regulatoryAuthority.findMany({
    orderBy: {
      code: "asc"
    }
  });

  return {
    authorities,
    riskLevels: [...riskLevelValues],
    statuses: [...actionStatusValues]
  };
}

export async function updateActionItemStatus(id: string, status: DirectiveFilters["status"]) {
  const actionItem = await prisma.actionItem.update({
    where: { id },
    data: { status: status! }
  });

  const directive = await prisma.complianceDirective.findUniqueOrThrow({
    where: {
      id: actionItem.directiveId
    },
    include: {
      authority: true,
      actionItems: true
    }
  });

  return {
    actionItem: {
      id: actionItem.id,
      directiveId: actionItem.directiveId,
      title: actionItem.title,
      assignedTo: actionItem.assignedTo,
      status: actionItem.status,
      priority: actionItem.priority,
      dueDate: actionItem.dueDate ? actionItem.dueDate.toISOString() : null,
      flagReason: actionItem.flagReason ?? null
    },
    directive: createDirectiveMeta(directive)
  };
}

function buildDirectiveWhere(filters: DirectiveFilters) {
  const andConditions: Record<string, unknown>[] = [];

  if (filters.riskLevel) {
    andConditions.push({
      riskLevel: filters.riskLevel
    });
  }

  if (filters.authorityCode) {
    andConditions.push({
      authority: {
        code: filters.authorityCode
      }
    });
  }

  if (filters.status) {
    andConditions.push({
      actionItems: {
        some: {
          status: filters.status
        }
      }
    });
  }

  if (filters.search) {
    andConditions.push({
      OR: [
        {
          title: {
            contains: filters.search,
            mode: "insensitive"
          }
        },
        {
          authority: {
            code: {
              contains: filters.search,
              mode: "insensitive"
            }
          }
        },
        {
          authority: {
            name: {
              contains: filters.search,
              mode: "insensitive"
            }
          }
        }
      ]
    });
  }

  return andConditions.length > 0 ? { AND: andConditions } : {};
}

