import type { ActionStatus } from "@artixio/shared";
import { Select } from "@/components/ui/select";

const transitionOptions: Record<ActionStatus, ActionStatus[]> = {
  PENDING: ["PENDING", "IN_REVIEW", "REJECTED"],
  IN_REVIEW: ["IN_REVIEW", "RESOLVED", "REJECTED"],
  RESOLVED: ["RESOLVED"],
  REJECTED: ["REJECTED"]
};

export function StatusSelect({
  value,
  onChange
}: {
  value: ActionStatus;
  onChange: (status: ActionStatus) => void;
}) {
  return (
    <Select value={value} onChange={(event) => onChange(event.target.value as ActionStatus)} className="h-8 min-w-[140px]">
      {transitionOptions[value].map((status) => (
        <option key={status} value={status}>
          {status.replace("_", " ")}
        </option>
      ))}
    </Select>
  );
}

