import { UserRound, Users, CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WaitingFor } from "@/types/domain";

export function WaitingForBadge({
  waitingFor,
  personName,
  className,
}: {
  waitingFor: WaitingFor;
  personName?: string | null;
  className?: string;
}) {
  if (waitingFor === "nobody") {
    return (
      <Badge variant="success" className={className}>
        <CircleCheck className="size-3" />
        Nobody
      </Badge>
    );
  }
  if (waitingFor === "both") {
    return (
      <Badge variant="warning" className={className}>
        <Users className="size-3" />
        Both
      </Badge>
    );
  }
  const label = waitingFor === "me" ? "Me" : personName || "Client";
  return (
    <Badge variant={waitingFor === "me" ? "info" : "warning"} className={className}>
      <UserRound className="size-3" />
      {label}
    </Badge>
  );
}
