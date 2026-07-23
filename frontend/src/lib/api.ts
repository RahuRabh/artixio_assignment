import {
  actionStatusUpdateResponseSchema,
  analyticsSummarySchema,
  directiveFiltersSchema,
  filterOptionsSchema,
  paginatedResponseSchema,
  directiveDetailSchema
} from "@artixio/shared";
import type {
  ActionStatus,
  ActionStatusUpdateResponse,
  AnalyticsSummaryDto,
  DirectiveDetail,
  DirectiveFilters,
  FilterOptionsDto,
  PaginatedResponse
} from "@artixio/shared";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit, schema?: { parse: (value: unknown) => T }) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(payload.message ?? "Request failed");
  }

  const json = await response.json();
  return schema ? schema.parse(json) : (json as T);
}

export async function fetchDirectives(filters: Partial<DirectiveFilters>) {
  const parsedFilters = directiveFiltersSchema.parse(filters);
  const params = new URLSearchParams();

  if (parsedFilters.search) params.set("search", parsedFilters.search);
  if (parsedFilters.riskLevel) params.set("riskLevel", parsedFilters.riskLevel);
  if (parsedFilters.status) params.set("status", parsedFilters.status);
  if (parsedFilters.authorityCode) params.set("authorityCode", parsedFilters.authorityCode);
  if (parsedFilters.anomaliesOnly) params.set("anomaliesOnly", "true");
  params.set("page", String(parsedFilters.page));
  params.set("pageSize", String(parsedFilters.pageSize));

  return request<PaginatedResponse<DirectiveDetail>>(
    `/api/directives?${params.toString()}`,
    undefined,
    paginatedResponseSchema(directiveDetailSchema)
  );
}

export async function fetchAnalyticsSummary() {
  return request<AnalyticsSummaryDto>("/api/analytics/summary", undefined, analyticsSummarySchema);
}

export async function fetchFilterOptions() {
  return request<FilterOptionsDto>("/api/filters", undefined, filterOptionsSchema);
}

export async function updateActionStatus(id: string, status: ActionStatus) {
  return request<ActionStatusUpdateResponse>(
    `/api/action-items/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status })
    },
    actionStatusUpdateResponseSchema
  );
}

