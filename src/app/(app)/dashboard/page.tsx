import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { AdminDashboard } from "./admin-dashboard";
import { ClientDashboard } from "./client-dashboard";

export const metadata: Metadata = { title: "Dashboard" };
// Force a fresh Postgres read on every visit — belt-and-suspenders against
// any edge/CDN caching ever serving a stale dashboard (e.g. an "Awaiting My
// Approval" count that doesn't yet include a version someone just sent).
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const user = await requireUser();
  return user.role === "admin" ? <AdminDashboard user={user} /> : <ClientDashboard user={user} />;
}
