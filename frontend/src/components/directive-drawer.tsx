import type { DirectiveDetail } from "@artixio/shared";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataHealthBadge } from "@/components/data-health-badge";
import { RiskBadge } from "@/components/risk-badge";
import { formatDate } from "@/lib/format";

type DrawerProps = {
  directive: DirectiveDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (actionItemId: string) => void;
};

export function DirectiveDrawer({ directive, open, onOpenChange, onResolve }: DrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto p-6">
        {directive ? (
          <>
            <div className="pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">{directive.authority.code}</Badge>
                <RiskBadge riskLevel={directive.riskLevel} />
                <DataHealthBadge health={directive.health} />
              </div>

              <SheetTitle className="mt-4 text-2xl font-semibold text-slate-950">
                {directive.title}
              </SheetTitle>
              <SheetDescription className="mt-2 text-sm text-slate-600">
                Effective {formatDate(directive.effectiveDate)} • {directive.authority.name} • {directive.authority.region}
              </SheetDescription>
            </div>

            <div className="mt-6 space-y-6">
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Directive Summary</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{directive.summary}</p>
              </section>

              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Action Items</h3>
                <div className="mt-3 space-y-3">
                  {directive.actionItems.map((actionItem) => (
                    <div key={actionItem.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-medium text-slate-900">{actionItem.title}</div>
                          <div className="mt-1 text-xs text-slate-600">
                            {actionItem.assignedTo} • {actionItem.priority} • Due {formatDate(actionItem.dueDate)}
                          </div>
                          {actionItem.flagReason ? (
                            <div className="mt-2 text-xs text-amber-700">{actionItem.flagReason}</div>
                          ) : null}
                        </div>
                        {actionItem.status !== "RESOLVED" && actionItem.status !== "REJECTED" ? (
                          <Button size="sm" onClick={() => onResolve(actionItem.id)}>
                            Mark as Resolved
                          </Button>
                        ) : (
                          <Badge variant="neutral">{actionItem.status}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Sanitization Log</h3>
                <div className="mt-3 space-y-2">
                  {directive.anomalies.length > 0 ? (
                    directive.anomalies.map((anomaly, index) => (
                      <div key={`${anomaly}-${index}`} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        {anomaly}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                      No sanitization issues detected.
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Raw Payload Inspector</h3>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                  {JSON.stringify(directive.rawPayload, null, 2)}
                </pre>
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

