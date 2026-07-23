import type { RiskLevel } from "@artixio/shared";
import { Badge } from "@/components/ui/badge";

const variants: Record<RiskLevel, "neutral" | "accent" | "warning" | "critical"> = {
  LOW: "neutral",
  MEDIUM: "accent",
  HIGH: "warning",
  CRITICAL: "critical"
};

export function RiskBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  return <Badge variant={variants[riskLevel]}>{riskLevel}</Badge>;
}

