import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { AvailabilityBadge } from "@/components/availability-badge";
import { Button } from "@/components/ui/button";
import { timezoneAbbrev } from "@/lib/timezones";
import { nextAvailableLabel } from "@/lib/domain-logic";
import type { Availability, TemporaryAvailability } from "@/types/domain";

export function TeamAvailabilityCard({
  name,
  role,
  availability,
  temporary,
  onScheduleHref,
}: {
  name: string;
  role?: string;
  availability: Availability | null;
  temporary: TemporaryAvailability[];
  onScheduleHref: string;
}) {
  const todaySlot = temporary.find((t) => t.date === new Date().toISOString().slice(0, 10));
  const next = nextAvailableLabel(availability, temporary);

  return (
    <Card className="p-0">
      <div className="p-4 flex items-center gap-3">
        <UserAvatar name={name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{name}</span>
            {role && <span className="text-xs text-muted-foreground">{role}</span>}
          </div>
          <AvailabilityBadge status={availability?.status ?? "away"} message={availability?.status_message} className="mt-0.5" />
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            {todaySlot && (
              <div>
                Today: {todaySlot.start} – {todaySlot.end}
              </div>
            )}
            {availability?.timezone && <div>Timezone: {availability.timezone.replace(/_/g, " ")} ({timezoneAbbrev(availability.timezone)})</div>}
            {next && <div>Next available: {next}</div>}
          </div>
        </div>
        <Button size="sm" variant="outline" asChild>
          <a href={onScheduleHref}>Schedule Review</a>
        </Button>
      </div>
    </Card>
  );
}
