import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { StatusSelector } from "@/components/availability/status-selector";
import { WeeklyScheduleEditor } from "@/components/availability/weekly-schedule-editor";
import { TemporaryAvailabilityList } from "@/components/availability/temporary-availability";
import { RequestCard } from "@/components/availability/request-card";
import { TeamAvailabilityCard } from "@/components/availability/team-availability-card";
import { RequestAvailabilityDialog } from "@/components/availability/request-availability-dialog";
import type { DaySchedule } from "@/types/domain";

export const metadata: Metadata = { title: "Availability" };

const DEFAULT_SCHEDULE: DaySchedule[] = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
  day: d as DaySchedule["day"],
  enabled: d !== 0 && d !== 6,
  start: "09:00",
  end: "18:00",
}));

export default async function AvailabilityPage() {
  const user = await requireUser();
  const repo = getRepository();

  const [myAvailability, myTemp, requests, profiles, clients] = await Promise.all([
    repo.getAvailability(user.id),
    repo.listTemporaryAvailability(user.id),
    repo.listAvailabilityRequests(user.organizationId, { profileId: user.id }),
    repo.listProfiles(user.organizationId),
    repo.listClients(user.organizationId),
  ]);

  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const incoming = requests.filter((r) => r.requested_of === user.id);
  const sent = requests.filter((r) => r.requested_by === user.id);

  const teamList =
    user.role === "admin"
      ? clients.map((c) => profileMap.get(c.profile_id)).filter(Boolean)
      : profiles.filter((p) => p.role === "admin");

  const teamAvailability = await Promise.all(
    teamList.map(async (p) => ({
      profile: p!,
      availability: await repo.getAvailability(p!.id),
      temp: await repo.listTemporaryAvailability(p!.id),
    }))
  );

  const requestPeople =
    user.role === "admin"
      ? clients.map((c) => profileMap.get(c.profile_id)).filter(Boolean).map((p) => ({ id: p!.id, name: p!.full_name }))
      : profiles.filter((p) => p.role === "admin").map((p) => ({ id: p.id, name: p.full_name }));

  return (
    <div>
      <PageHeader
        title="Availability"
        subtitle="Set your availability and see when your team and clients are free."
        actions={<RequestAvailabilityDialog people={requestPeople} />}
      />

      <div className="px-4 lg:px-6 pb-10 grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="p-0">
            <CardHeader className="pt-5 pb-0"><CardTitle className="text-sm">Current Status</CardTitle></CardHeader>
            <CardContent className="pt-4 pb-5">
              <StatusSelector currentStatus={myAvailability?.status ?? "available"} currentMessage={myAvailability?.status_message} />
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardHeader className="pt-5 pb-0"><CardTitle className="text-sm">Weekly Schedule</CardTitle></CardHeader>
            <CardContent className="pt-4 pb-5">
              <WeeklyScheduleEditor
                schedule={myAvailability?.weekly_schedule ?? DEFAULT_SCHEDULE}
                timezone={myAvailability?.timezone ?? user.timezone}
              />
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardHeader className="pt-5 pb-0"><CardTitle className="text-sm">Temporary Availability</CardTitle></CardHeader>
            <CardContent className="pt-4 pb-5">
              <TemporaryAvailabilityList slots={myTemp} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-0">
            <CardHeader className="pt-5 pb-0"><CardTitle className="text-sm">Requests for you</CardTitle></CardHeader>
            <CardContent className="pt-4 pb-5 space-y-2.5">
              {incoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending requests.</p>
              ) : (
                incoming.map((r) => (
                  <RequestCard key={r.id} request={r} requesterName={profileMap.get(r.requested_by)?.full_name} canRespond />
                ))
              )}
            </CardContent>
          </Card>

          {sent.length > 0 && (
            <Card className="p-0">
              <CardHeader className="pt-5 pb-0"><CardTitle className="text-sm">Requests you sent</CardTitle></CardHeader>
              <CardContent className="pt-4 pb-5 space-y-2.5">
                {sent.map((r) => (
                  <RequestCard key={r.id} request={r} requesterName={profileMap.get(r.requested_of)?.full_name} canRespond={false} />
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="p-0">
            <CardHeader className="pt-5 pb-0">
              <CardTitle className="text-sm">{user.role === "admin" ? "Client Availability" : "Team Availability"}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-5 space-y-2.5">
              {teamAvailability.length === 0 ? (
                <EmptyState icon={Clock} title="Nobody to show yet" className="border-none py-6" />
              ) : (
                teamAvailability.map(({ profile, availability, temp }) => (
                  <TeamAvailabilityCard
                    key={profile.id}
                    name={profile.full_name}
                    role={profile.title ?? undefined}
                    availability={availability}
                    temporary={temp}
                    onScheduleHref="/availability"
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
