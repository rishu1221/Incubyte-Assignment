import type { EmploymentStatus } from "@/api/types";
import { Badge } from "@/components/ui/badge";

const labels: Record<EmploymentStatus, string> = {
  ACTIVE: "Active",
  ON_LEAVE: "On leave",
  TERMINATED: "Terminated",
};

export function StatusBadge({ status }: { status: EmploymentStatus }) {
  const variant = status === "TERMINATED" ? "outline" : status === "ON_LEAVE" ? "secondary" : "default";
  return <Badge variant={variant}>{labels[status]}</Badge>;
}
