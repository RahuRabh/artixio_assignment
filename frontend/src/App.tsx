import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ActionStatus, DirectiveDetail, DirectiveFilters, PaginatedResponse } from "@artixio/shared";
import { Toaster, toast } from "sonner";
import { AlertCircle, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { fetchAnalyticsSummary, fetchDirectives, fetchFilterOptions, updateActionStatus } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { MetricsStrip } from "@/components/metrics-strip";
import { FiltersToolbar } from "@/components/filters-toolbar";
import { TriageTable } from "@/components/triage-table";
import { DirectiveDrawer } from "@/components/directive-drawer";
import { Button } from "@/components/ui/button";

const initialFilters: DirectiveFilters = {
  search: "",
  anomaliesOnly: false,
  page: 1,
  pageSize: 12
};

export default function App() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<DirectiveFilters>(initialFilters);
  const [search, setSearch] = useState("");
  const [selectedDirectiveId, setSelectedDirectiveId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 350);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      page: 1,
      search: debouncedSearch
    }));
  }, [debouncedSearch]);

  const directivesQuery = useQuery({
    queryKey: ["directives", filters],
    queryFn: () => fetchDirectives(filters),
    placeholderData: keepPreviousData
  });

  const analyticsQuery = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: fetchAnalyticsSummary
  });

  const filterOptionsQuery = useQuery({
    queryKey: ["filter-options"],
    queryFn: fetchFilterOptions
  });

  const selectedDirective = useMemo(
    () => directivesQuery.data?.items.find((directive) => directive.id === selectedDirectiveId) ?? null,
    [directivesQuery.data?.items, selectedDirectiveId]
  );

  const statusMutation = useMutation({
    mutationFn: ({ actionItemId, status }: { actionItemId: string; status: ActionStatus }) =>
      updateActionStatus(actionItemId, status),
    onMutate: async ({ actionItemId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["directives"] });
      const previous = queryClient.getQueriesData<PaginatedResponse<DirectiveDetail>>({ queryKey: ["directives"] });

      queryClient.setQueriesData<PaginatedResponse<DirectiveDetail>>({ queryKey: ["directives"] }, (current) => {
        if (!current) return current;

        return {
          ...current,
          items: current.items.map((directive) => {
            const hasTarget = directive.actionItems.some((actionItem) => actionItem.id === actionItemId);
            if (!hasTarget) return directive;

            const actionItems = directive.actionItems.map((actionItem) =>
              actionItem.id === actionItemId ? { ...actionItem, status } : actionItem
            );
            const primaryActionItem = directive.primaryActionItem?.id === actionItemId
              ? { ...directive.primaryActionItem, status }
              : directive.primaryActionItem;

            return {
              ...directive,
              actionItems,
              primaryActionItem
            };
          })
        };
      });

      return { previous };
    },
    onSuccess: (payload) => {
      queryClient.setQueriesData<PaginatedResponse<DirectiveDetail>>({ queryKey: ["directives"] }, (current) => {
        if (!current) return current;

        return {
          ...current,
          items: current.items.map((directive) => {
            if (directive.id !== payload.directive.directiveId) {
              return directive;
            }

            return {
              ...directive,
              hasAnomaly: payload.directive.hasAnomaly,
              health: payload.directive.health,
              anomalies: payload.directive.anomalies,
              primaryActionItem: payload.directive.primaryActionItem,
              actionItems: payload.directive.actionItems
            };
          })
        };
      });

      void queryClient.invalidateQueries({ queryKey: ["analytics-summary"] });
      toast.success("Action item status updated");
    },
    onError: (error, _variables, context) => {
      context?.previous.forEach(([queryKey, value]) => {
        queryClient.setQueryData(queryKey, value);
      });
      toast.error(error instanceof Error ? error.message : "Unable to update action item");
    }
  });

  function handleFilterChange<K extends keyof DirectiveFilters>(key: K, value: DirectiveFilters[K]) {
    setFilters((current) => ({
      ...current,
      page: key === "page" ? (value as number) : 1,
      [key]: value
    }));
  }

  const directives = directivesQuery.data?.items ?? [];
  const page = directivesQuery.data?.page ?? 1;
  const totalPages = directivesQuery.data?.totalPages ?? 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.18),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] text-slate-950">
      <Toaster position="top-right" richColors />
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-5 lg:px-6">
        <header className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              <Shield className="h-4 w-4" />
              Artixio Regulatory Decision Layer
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Compliance triage workspace
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Review messy regulatory updates, surface anomalies safely, and push action item decisions without leaving the grid.
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            July 23, 2026 reference clock active. Overdue resolved items are intentionally flagged.
          </div>
        </header>

        <MetricsStrip summary={analyticsQuery.data} />

        <div className="mt-4">
          <FiltersToolbar
            search={search}
            onSearchChange={setSearch}
            filters={filters}
            options={filterOptionsQuery.data}
            onFilterChange={handleFilterChange}
          />
        </div>

        {directivesQuery.isError ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <AlertCircle className="h-4 w-4" />
            {directivesQuery.error instanceof Error ? directivesQuery.error.message : "Failed to load directives"}
          </div>
        ) : null}

        <div className="mt-4 flex-1">
          <TriageTable
            data={directives}
            onOpenDirective={setSelectedDirectiveId}
            onStatusChange={(actionItemId, status) => statusMutation.mutate({ actionItemId, status })}
          />
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-panel">
          <div className="text-sm text-slate-600">
            Page {page} of {Math.max(totalPages, 1)} • {directivesQuery.data?.total ?? 0} directives
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => handleFilterChange("page", page - 1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={totalPages === 0 || page >= totalPages}
              onClick={() => handleFilterChange("page", page + 1)}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <DirectiveDrawer
        directive={selectedDirective}
        open={Boolean(selectedDirective)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDirectiveId(null);
          }
        }}
        onResolve={(actionItemId) => statusMutation.mutate({ actionItemId, status: "RESOLVED" })}
      />
    </div>
  );
}

