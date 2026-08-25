import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { AdminDashboard } from "./admin-dashboard";
import { ClientDashboard } from "./client-dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  return user.role === "admin" ? <AdminDashboard user={user} /> : <ClientDashboard user={user} />;
}
