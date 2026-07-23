import type { AnalyticsSummaryDto } from "@artixio/shared";
import { Card } from "@/components/ui/card";

const metricConfig = [
  { key: "totalDirectives", label: "Total Directives" },
  { key: "pendingActionItems", label: "Pending Items" },
  { key: "highCriticalDirectives", label: "High / Critical" },
  { key: "flaggedAnomalies", label: "Flagged Anomalies" }
] as const;

export function MetricsStrip({ summary }: { summary?: AnalyticsSummaryDto }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {metricConfig.map((metric) => (
        <Card key={metric.key} className="rounded-lg px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {metric.label}
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {summary ? summary[metric.key] : "--"}
          </div>
        </Card>
      ))}
    </div>
  );
}

