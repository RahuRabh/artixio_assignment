import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";
import type { DataHealth } from "@artixio/shared";
import { Badge } from "@/components/ui/badge";

export function DataHealthBadge({ health }: { health: DataHealth }) {
  if (health === "CLEAN") {
    return (
      <Badge variant="success" className="gap-1">
        <ShieldCheck className="h-3.5 w-3.5" />
        Clean
      </Badge>
    );
  }

  if (health === "CORRUPT_PAYLOAD") {
    return (
      <Badge variant="danger" className="gap-1">
        <ShieldAlert className="h-3.5 w-3.5" />
        Corrupt Payload
      </Badge>
    );
  }

  return (
    <Badge variant="warning" className="gap-1">
      <AlertTriangle className="h-3.5 w-3.5" />
      Anomaly
    </Badge>
  );
}

