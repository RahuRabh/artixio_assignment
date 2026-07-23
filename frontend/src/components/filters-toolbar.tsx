import type { ActionStatus, DirectiveFilters, FilterOptionsDto, RiskLevel } from "@artixio/shared";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";

type ToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filters: DirectiveFilters;
  options?: FilterOptionsDto;
  onFilterChange: <K extends keyof DirectiveFilters>(key: K, value: DirectiveFilters[K]) => void;
};

export function FiltersToolbar({
  search,
  onSearchChange,
  filters,
  options,
  onFilterChange
}: ToolbarProps) {
  return (
    <Card className="rounded-lg px-4 py-3">
      <div className="grid gap-3 xl:grid-cols-[2fr_repeat(4,minmax(0,1fr))_auto]">
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search directive title or authority"
        />

        <Select
          value={filters.riskLevel ?? ""}
          onChange={(event) => onFilterChange("riskLevel", (event.target.value || undefined) as RiskLevel | undefined)}
        >
          <option value="">All Risk Levels</option>
          {options?.riskLevels.map((riskLevel) => (
            <option key={riskLevel} value={riskLevel}>
              {riskLevel}
            </option>
          ))}
        </Select>

        <Select
          value={filters.authorityCode ?? ""}
          onChange={(event) => onFilterChange("authorityCode", event.target.value || undefined)}
        >
          <option value="">All Authorities</option>
          {options?.authorities.map((authority) => (
            <option key={authority.id} value={authority.code}>
              {authority.code}
            </option>
          ))}
        </Select>

        <Select
          value={filters.status ?? ""}
          onChange={(event) => onFilterChange("status", (event.target.value || undefined) as ActionStatus | undefined)}
        >
          <option value="">All Statuses</option>
          {options?.statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>

        <Select
          value={String(filters.pageSize)}
          onChange={(event) => onFilterChange("pageSize", Number(event.target.value))}
        >
          {[12, 18, 24, 36].map((size) => (
            <option key={size} value={size}>
              {size} rows
            </option>
          ))}
        </Select>

        <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
          <span className="text-sm font-medium text-slate-700">Anomalies Only</span>
          <Switch
            checked={filters.anomaliesOnly}
            onCheckedChange={(checked) => onFilterChange("anomaliesOnly", checked)}
          />
        </div>
      </div>
    </Card>
  );
}

