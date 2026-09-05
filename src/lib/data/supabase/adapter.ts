import { randomUUID } from "node:crypto";
import { createServerSupabaseClient } from "./client";
import type { Repository, CurrentUser } from "@/lib/data/repository";
import type {
  Approval,
  ActivityLog,
  AvailabilityRequest,
  Availability,
  CalendarEvent,
  Client,
  DaySchedule,
  Integration,
  Issue,
  IssueComment,
  Notification,
  Organization,
  Payment,
  PaymentStatus,
  Profile,
  Project,
  ProjectFile,
  ProjectHealthResult,
  ProjectMember,
  ProjectSettings,
  Tag,
  Task,
  TaskComment,
  TaskVersion,
  TaskVersionComment,
  TemporaryAvailability,
  Topic,
} from "@/types/domain";

// ============================================================================
// Supabase-backed Repository implementation.
//
// Every method opens its own request-scoped client via
// createServerSupabaseClient() (cookie-bound, so it carries the signed-in
// user's session and every query runs under their RLS policies — see
// supabase/migrations/0002_rls_policies.sql and 0003_payments.sql). This is
// deliberate defense-in-depth: the Server Actions in src/lib/actions/*.ts
// already gate who can call what, and Postgres enforces the same rules again
// underneath.
//
// A couple of things this file does NOT do (by design, for now):
//  - It doesn't wrap multi-step writes (e.g. decideApproval's cascade onto
//    the linked task) in a database transaction. Two sequential awaited
//    calls, same as the mock adapter's two sequential mutations. Fine for
//    this app's write volume; worth an RPC function if that ever changes.
//  - createProfile assumes a Supabase Auth user already exists for the id
//    you pass in (profiles.id is a foreign key to auth.users.id with no
//    default). Real invite-by-email — creating the auth user first — is the
//    "Step 5: real authentication" work, not this data-layer pass.
// ============================================================================

function err(action: string, error: { message: string } | null): never {
  throw new Error(`Supabase ${action} failed: ${error?.message ?? "unknown error"}`);
}

function trimTime(t: string | null | undefined): string {
  // Postgres `time` columns come back as "09:00:00" — the app's domain type
  // uses "09:00". Writes accept either, so only reads need normalizing.
  return t ? t.slice(0, 5) : t ?? "";
}

class SupabaseRepository implements Repository {
  // -- Auth / session ---------------------------------------------------

  async getCurrentUser(): Promise<CurrentUser | null> {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (error) err("getCurrentUser", error);
    if (!profile) return null;

    return {
      id: profile.id,
      organizationId: profile.organization_id,
      role: profile.role,
      fullName: profile.full_name,
      email: profile.email,
      avatarUrl: profile.avatar_url,
      timezone: profile.timezone,
    };
  }

  // -- Organizations / profiles ------------------------------------------

  async getOrganization(id: string): Promise<Organization | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("organizations").select("*").eq("id", id).maybeSingle();
    if (error) err("getOrganization", error);
    return data ?? null;
  }

  async updateOrganization(id: string, patch: Partial<Organization>): Promise<Organization> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("organizations").update(patch).eq("id", id).select().single();
    if (error) err("updateOrganization", error);
    return data;
  }

  async listProfiles(organizationId: string): Promise<Profile[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("profiles").select("*").eq("organization_id", organizationId);
    if (error) err("listProfiles", error);
    return data ?? [];
  }

  async getProfile(id: string): Promise<Profile | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    if (error) err("getProfile", error);
    return data ?? null;
  }

  async createProfile(input: Omit<Profile, "id" | "created_at">): Promise<Profile> {
    const supabase = await createServerSupabaseClient();
    const withId = input as Partial<Profile> & { id?: string };
    if (!withId.id) {
      throw new Error(
        "createProfile requires a Supabase Auth user to already exist (profiles.id references auth.users.id). " +
          "Create the auth user first (invite-by-email / sign-up), then call this with that id."
      );
    }
    // NOTE: split into two statements for the same reason as createProject
    // below — profiles_select calls is_admin(), which queries the
    // profiles table itself, and that self-check on a row this same
    // statement just inserted can spuriously fail when combined with
    // .select() (which turns the insert into INSERT ... RETURNING).
    const { error: insertErr } = await supabase.from("profiles").insert(withId);
    if (insertErr) err("createProfile", insertErr);
    const { data, error } = await supabase.from("profiles").select("*").eq("id", withId.id).single();
    if (error) err("createProfile (fetch)", error);
    return data;
  }

  async updateProfile(id: string, patch: Partial<Profile>): Promise<Profile> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("profiles").update(patch).eq("id", id).select().single();
    if (error) err("updateProfile", error);
    return data;
  }

  // -- Clients -------------------------------------------------------------

  async listClients(organizationId: string): Promise<Client[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("clients").select("*").eq("organization_id", organizationId);
    if (error) err("listClients", error);
    return data ?? [];
  }

  async getClient(id: string): Promise<Client | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
    if (error) err("getClient", error);
    return data ?? null;
  }

  async getClientByProfileId(profileId: string): Promise<Client | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("clients").select("*").eq("profile_id", profileId).maybeSingle();
    if (error) err("getClientByProfileId", error);
    return data ?? null;
  }

  async createClient(input: Omit<Client, "id" | "created_at">): Promise<Client> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("clients").insert(input).select().single();
    if (error) err("createClient", error);
    return data;
  }

  async updateClient(id: string, patch: Partial<Client>): Promise<Client> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("clients").update(patch).eq("id", id).select().single();
    if (error) err("updateClient", error);
    return data;
  }

  async deleteClient(id: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) err("deleteClient", error);
  }

  // -- Projects --------------------------------------------------------------

  async listProjects(organizationId: string, opts?: { clientId?: string; profileId?: string }): Promise<Project[]> {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("projects").select("*").eq("organization_id", organizationId);
    if (opts?.clientId) query = query.eq("client_id", opts.clientId);
    if (opts?.profileId) {
      const { data: memberRows, error: memberErr } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("profile_id", opts.profileId);
      if (memberErr) err("listProjects (member scoping)", memberErr);
      const ids = (memberRows ?? []).map((m) => m.project_id);
      if (ids.length === 0) return [];
      query = query.in("id", ids);
    }
    const { data, error } = await query.order("deadline", { ascending: true, nullsFirst: true });
    if (error) err("listProjects", error);
    return data ?? [];
  }

  async getProject(id: string): Promise<Project | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
    if (error) err("getProject", error);
    return data ?? null;
  }

  async createProject(input: Omit<Project, "id" | "created_at" | "progress">): Promise<Project> {
    const supabase = await createServerSupabaseClient();
    // NOTE: this insert is deliberately NOT chained with .select() here.
    // projects' own RLS SELECT policy (projects_select) calls
    // can_access_project(id), which runs its own sub-query back against
    // the projects table. Postgres does not consistently see a row this
    // same INSERT statement just created when that visibility check is
    // evaluated as part of an INSERT ... RETURNING (which is what
    // .insert().select() compiles to) — it intermittently reports "new
    // row violates row-level security policy for table \"projects\"" even
    // though the insert itself is perfectly authorized. Generating the id
    // ourselves and fetching the row back as a separate, second statement
    // avoids that RETURNING-time check entirely and reliably works.
    const id = randomUUID();
    const { error: insertErr } = await supabase.from("projects").insert({ ...input, id, progress: 0 });
    if (insertErr) err("createProject", insertErr);
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
    if (error) err("createProject (fetch)", error);
    const { error: settingsErr } = await supabase.from("project_settings").insert({
      project_id: data.id,
      drive_structure_created: false,
      client_can_upload: true,
      client_can_see_internal_notes: false,
      notify_on_client_comment: true,
    });
    if (settingsErr) err("createProject (settings)", settingsErr);
    return data;
  }

  async updateProject(id: string, patch: Partial<Project>): Promise<Project> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("projects").update(patch).eq("id", id).select().single();
    if (error) err("updateProject", error);
    return data;
  }

  async deleteProject(id: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) err("deleteProject", error);
  }

  async listProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("project_members").select("*").eq("project_id", projectId);
    if (error) err("listProjectMembers", error);
    return data ?? [];
  }

  async addProjectMember(input: Omit<ProjectMember, "id" | "created_at">): Promise<ProjectMember> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("project_members").insert(input).select().single();
    if (error) err("addProjectMember", error);
    return data;
  }

  async getProjectSettings(projectId: string): Promise<ProjectSettings | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("project_settings")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle();
    if (error) err("getProjectSettings", error);
    return data ?? null;
  }

  async getProjectHealth(projectId: string): Promise<ProjectHealthResult> {
    const supabase = await createServerSupabaseClient();
    const now = new Date().toISOString();
    const [{ data: tasks, error: taskErr }, { data: issues, error: issueErr }, { data: approvals, error: apprErr }] =
      await Promise.all([
        supabase.from("tasks").select("id,status,deadline").eq("project_id", projectId),
        supabase.from("issues").select("id,status").eq("project_id", projectId),
        supabase.from("approvals").select("id,status").eq("project_id", projectId),
      ]);
    if (taskErr) err("getProjectHealth (tasks)", taskErr);
    if (issueErr) err("getProjectHealth (issues)", issueErr);
    if (apprErr) err("getProjectHealth (approvals)", apprErr);

    const overdue = (tasks ?? []).filter(
      (t) => t.deadline && t.deadline < now && t.status !== "completed" && t.status !== "cancelled"
    );
    const blocked = (tasks ?? []).filter((t) => t.status === "blocked" || t.status === "corrections_required");
    const openIssues = (issues ?? []).filter(
      (i) => i.status === "open" || i.status === "in_progress" || i.status === "waiting"
    );
    const pendingApprovals = (approvals ?? []).filter((a) => a.status === "waiting_client");

    const reasons: string[] = [];
    if (overdue.length > 0) reasons.push(`${overdue.length} task${overdue.length > 1 ? "s" : ""} overdue`);
    if (blocked.length > 0) reasons.push(`${blocked.length} task${blocked.length > 1 ? "s" : ""} blocked`);
    if (openIssues.length > 0) reasons.push(`${openIssues.length} open issue${openIssues.length > 1 ? "s" : ""}`);
    if (pendingApprovals.length > 0)
      reasons.push(`${pendingApprovals.length} approval${pendingApprovals.length > 1 ? "s" : ""} pending`);

    let health: ProjectHealthResult["health"] = "healthy";
    const riskScore = overdue.length * 2 + blocked.length * 2 + openIssues.length + pendingApprovals.length * 0.5;
    if (riskScore >= 4) health = "at_risk";
    else if (riskScore > 0) health = "needs_attention";

    return {
      health,
      reasons: reasons.length ? reasons : ["Everything on track"],
      overdueCount: overdue.length,
      blockedCount: blocked.length,
      openIssueCount: openIssues.length,
      pendingApprovalCount: pendingApprovals.length,
    };
  }

  // -- Tasks ------------------------------------------------------------------

  async listTasks(organizationId: string, filters?: Parameters<Repository["listTasks"]>[1]): Promise<Task[]> {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("tasks").select("*").eq("organization_id", organizationId);
    if (filters?.projectId) query = query.eq("project_id", filters.projectId);
    if (filters?.assigneeId) query = query.eq("assignee_id", filters.assigneeId);
    if (filters?.status?.length) query = query.in("status", filters.status);
    if (filters?.waitingFor) query = query.eq("waiting_for", filters.waitingFor);
    if (filters?.topicId) query = query.eq("topic_id", filters.topicId);
    const { data, error } = await query.order("deadline", { ascending: true, nullsFirst: false });
    if (error) err("listTasks", error);
    return data ?? [];
  }

  async getTask(id: string): Promise<Task | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("tasks").select("*").eq("id", id).maybeSingle();
    if (error) err("getTask", error);
    return data ?? null;
  }

  async createTask(input: Omit<Task, "id" | "created_at" | "updated_at" | "position">): Promise<Task> {
    const supabase = await createServerSupabaseClient();
    const { count, error: countErr } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("project_id", input.project_id);
    if (countErr) err("createTask (position)", countErr);
    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...input, position: (count ?? 0) + 1 })
      .select()
      .single();
    if (error) err("createTask", error);
    return data;
  }

  async updateTask(id: string, patch: Partial<Task>): Promise<Task> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("tasks").update(patch).eq("id", id).select().single();
    if (error) err("updateTask", error);
    return data;
  }

  async deleteTask(id: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) err("deleteTask", error);
  }

  async listTaskComments(taskId: string): Promise<TaskComment[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    if (error) err("listTaskComments", error);
    return data ?? [];
  }

  async addTaskComment(input: Omit<TaskComment, "id" | "created_at">): Promise<TaskComment> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("task_comments").insert(input).select().single();
    if (error) err("addTaskComment", error);
    return data;
  }

  async listTaskVersions(taskId: string): Promise<TaskVersion[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("task_versions")
      .select("*")
      .eq("task_id", taskId)
      .order("version_number", { ascending: true });
    if (error) err("listTaskVersions", error);
    return data ?? [];
  }

  async createTaskVersion(
    input: Omit<TaskVersion, "id" | "created_at" | "version_number">
  ): Promise<TaskVersion> {
    const supabase = await createServerSupabaseClient();
    const { count, error: countErr } = await supabase
      .from("task_versions")
      .select("id", { count: "exact", head: true })
      .eq("task_id", input.task_id);
    if (countErr) err("createTaskVersion (count)", countErr);
    const versionNumber = (count ?? 0) + 1;
    const id = randomUUID();
    const { error: insertErr } = await supabase
      .from("task_versions")
      .insert({ ...input, id, version_number: versionNumber });
    if (insertErr) err("createTaskVersion", insertErr);
    const { data, error } = await supabase.from("task_versions").select("*").eq("id", id).single();
    if (error) err("createTaskVersion (fetch)", error);
    return data;
  }

  async updateTaskVersion(
    id: string,
    patch: Partial<Omit<TaskVersion, "id" | "task_id" | "organization_id" | "version_number" | "created_by" | "created_at">>
  ): Promise<TaskVersion> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("task_versions")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) err("updateTaskVersion", error);
    return data;
  }

  async deleteTaskVersion(id: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("task_versions").delete().eq("id", id);
    if (error) err("deleteTaskVersion", error);
  }

  async listVersionComments(versionId: string): Promise<TaskVersionComment[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("task_version_comments")
      .select("*")
      .eq("version_id", versionId)
      .order("created_at", { ascending: true });
    if (error) err("listVersionComments", error);
    return data ?? [];
  }

  async addVersionComment(input: Omit<TaskVersionComment, "id" | "created_at">): Promise<TaskVersionComment> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("task_version_comments").insert(input).select().single();
    if (error) err("addVersionComment", error);
    return data;
  }

  async uploadImage(path: string, data: Buffer, contentType: string): Promise<string> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.storage
      .from("version-images")
      .upload(path, data, { contentType, upsert: false });
    if (error) err("uploadImage", error);
    const { data: pub } = supabase.storage.from("version-images").getPublicUrl(path);
    return pub.publicUrl;
  }

  async listTags(organizationId: string): Promise<Tag[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("tags").select("*").eq("organization_id", organizationId);
    if (error) err("listTags", error);
    return data ?? [];
  }

  async getTaskTags(taskId: string): Promise<Tag[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("task_tags").select("tag:tags(*)").eq("task_id", taskId);
    if (error) err("getTaskTags", error);
    return (data ?? []).flatMap((row) => (row.tag ? [row.tag as unknown as Tag] : []));
  }

  // -- Topics -----------------------------------------------------------------

  async listTopics(organizationId: string, opts?: { projectId?: string }): Promise<Topic[]> {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("topics").select("*").eq("organization_id", organizationId);
    if (opts?.projectId) query = query.eq("project_id", opts.projectId);
    const { data, error } = await query.order("position", { ascending: true });
    if (error) err("listTopics", error);
    return data ?? [];
  }

  async getTopic(id: string): Promise<Topic | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("topics").select("*").eq("id", id).maybeSingle();
    if (error) err("getTopic", error);
    return data ?? null;
  }

  async createTopic(input: Omit<Topic, "id" | "created_at" | "position">): Promise<Topic> {
    const supabase = await createServerSupabaseClient();
    const { count, error: countErr } = await supabase
      .from("topics")
      .select("id", { count: "exact", head: true })
      .eq("project_id", input.project_id);
    if (countErr) err("createTopic (position)", countErr);
    const { data, error } = await supabase
      .from("topics")
      .insert({ ...input, position: (count ?? 0) + 1 })
      .select()
      .single();
    if (error) err("createTopic", error);
    return data;
  }

  async updateTopic(id: string, patch: Partial<Topic>): Promise<Topic> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("topics").update(patch).eq("id", id).select().single();
    if (error) err("updateTopic", error);
    return data;
  }

  async getNextTopic(organizationId: string, projectId?: string): Promise<Topic | null> {
    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from("topics")
      .select("*")
      .eq("organization_id", organizationId)
      .in("status", ["ready_to_start", "idea"]);
    if (projectId) query = query.eq("project_id", projectId);
    const { data, error } = await query;
    if (error) err("getNextTopic", error);
    const topics = [...(data ?? [])];
    topics.sort((a, b) => {
      if (a.status !== b.status) return a.status === "ready_to_start" ? -1 : 1;
      return (a.expected_start ?? "9999").localeCompare(b.expected_start ?? "9999");
    });
    return topics[0] ?? null;
  }

  // -- Issues ------------------------------------------------------------------

  async listIssues(
    organizationId: string,
    opts?: { projectId?: string; status?: Issue["status"][] }
  ): Promise<Issue[]> {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("issues").select("*").eq("organization_id", organizationId);
    if (opts?.projectId) query = query.eq("project_id", opts.projectId);
    if (opts?.status?.length) query = query.in("status", opts.status);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) err("listIssues", error);
    return data ?? [];
  }

  async getIssue(id: string): Promise<Issue | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("issues").select("*").eq("id", id).maybeSingle();
    if (error) err("getIssue", error);
    return data ?? null;
  }

  async createIssue(input: Omit<Issue, "id" | "created_at">): Promise<Issue> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("issues").insert(input).select().single();
    if (error) err("createIssue", error);
    return data;
  }

  async updateIssue(id: string, patch: Partial<Issue>): Promise<Issue> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("issues").update(patch).eq("id", id).select().single();
    if (error) err("updateIssue", error);
    return data;
  }

  async deleteIssue(id: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("issues").delete().eq("id", id);
    if (error) err("deleteIssue", error);
  }

  async listIssueComments(issueId: string): Promise<IssueComment[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("issue_comments")
      .select("*")
      .eq("issue_id", issueId)
      .order("created_at", { ascending: true });
    if (error) err("listIssueComments", error);
    return data ?? [];
  }

  async addIssueComment(input: Omit<IssueComment, "id" | "created_at">): Promise<IssueComment> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("issue_comments").insert(input).select().single();
    if (error) err("addIssueComment", error);
    return data;
  }

  // -- Files -------------------------------------------------------------------

  async listFiles(organizationId: string, opts?: { projectId?: string; category?: string }): Promise<ProjectFile[]> {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("files").select("*").eq("organization_id", organizationId);
    if (opts?.projectId) query = query.eq("project_id", opts.projectId);
    if (opts?.category) query = query.eq("category", opts.category);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) err("listFiles", error);
    return data ?? [];
  }

  async createFile(input: Omit<ProjectFile, "id" | "created_at" | "version">): Promise<ProjectFile> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("files")
      .insert({ ...input, version: 1 })
      .select()
      .single();
    if (error) err("createFile", error);
    return data;
  }

  async deleteFile(id: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("files").delete().eq("id", id);
    if (error) err("deleteFile", error);
  }

  // -- Approvals --------------------------------------------------------------

  async listApprovals(
    organizationId: string,
    opts?: { projectId?: string; status?: Approval["status"][] }
  ): Promise<Approval[]> {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("approvals").select("*").eq("organization_id", organizationId);
    if (opts?.projectId) query = query.eq("project_id", opts.projectId);
    if (opts?.status?.length) query = query.in("status", opts.status);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) err("listApprovals", error);
    return data ?? [];
  }

  async getApproval(id: string): Promise<Approval | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("approvals").select("*").eq("id", id).maybeSingle();
    if (error) err("getApproval", error);
    return data ?? null;
  }

  async createApproval(input: Omit<Approval, "id" | "created_at">): Promise<Approval> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("approvals").insert(input).select().single();
    if (error) err("createApproval", error);
    return data;
  }

  async decideApproval(
    id: string,
    decision: "approved" | "changes_requested",
    decidedBy: string,
    feedback?: string
  ): Promise<Approval> {
    const supabase = await createServerSupabaseClient();
    const existing = await this.getApproval(id);
    if (!existing) throw new Error("Approval not found");

    const { data: approval, error } = await supabase
      .from("approvals")
      .update({
        status: decision,
        decided_by: decidedBy,
        feedback: feedback ?? existing.feedback,
        decided_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) err("decideApproval", error);

    if (approval.task_id) {
      const task = await this.getTask(approval.task_id);
      if (task) {
        if (decision === "approved") {
          const { error: taskErr } = await supabase
            .from("tasks")
            .update({ status: "completed", waiting_for: "nobody", completed_at: new Date().toISOString() })
            .eq("id", task.id);
          if (taskErr) err("decideApproval (task cascade)", taskErr);
        } else {
          const { error: taskErr } = await supabase
            .from("tasks")
            .update({
              status: "corrections_required",
              waiting_for: "me",
              waiting_for_profile_id: task.assignee_id,
            })
            .eq("id", task.id);
          if (taskErr) err("decideApproval (task cascade)", taskErr);
        }
      }
    }
    return approval;
  }

  // -- Payments -----------------------------------------------------------------

  async listPayments(
    organizationId: string,
    opts?: { projectId?: string; clientId?: string; status?: PaymentStatus[] }
  ): Promise<Payment[]> {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("payments").select("*").eq("organization_id", organizationId);
    if (opts?.projectId) query = query.eq("project_id", opts.projectId);
    if (opts?.clientId) query = query.eq("client_id", opts.clientId);
    if (opts?.status?.length) query = query.in("status", opts.status);
    const { data, error } = await query.order("issued_date", { ascending: false });
    if (error) err("listPayments", error);
    return (data ?? []).map((p) => ({ ...p, amount: Number(p.amount) }));
  }

  async getPayment(id: string): Promise<Payment | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("payments").select("*").eq("id", id).maybeSingle();
    if (error) err("getPayment", error);
    return data ? { ...data, amount: Number(data.amount) } : null;
  }

  async createPayment(input: Omit<Payment, "id" | "created_at">): Promise<Payment> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("payments").insert(input).select().single();
    if (error) err("createPayment", error);
    return { ...data, amount: Number(data.amount) };
  }

  async updatePayment(id: string, patch: Partial<Payment>): Promise<Payment> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("payments").update(patch).eq("id", id).select().single();
    if (error) err("updatePayment", error);
    return { ...data, amount: Number(data.amount) };
  }

  // -- Availability --------------------------------------------------------------

  async getAvailability(profileId: string): Promise<Availability | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("availability").select("*").eq("profile_id", profileId).maybeSingle();
    if (error) err("getAvailability", error);
    if (!data) return null;
    return { ...data, weekly_schedule: (data.weekly_schedule ?? []) as DaySchedule[] };
  }

  async upsertAvailability(input: Availability): Promise<Availability> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("availability")
      .upsert({ ...input, updated_at: new Date().toISOString() }, { onConflict: "profile_id" })
      .select()
      .single();
    if (error) err("upsertAvailability", error);
    return { ...data, weekly_schedule: (data.weekly_schedule ?? []) as DaySchedule[] };
  }

  async listTemporaryAvailability(profileId: string): Promise<TemporaryAvailability[]> {
    const supabase = await createServerSupabaseClient();
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("temporary_availability")
      .select("*")
      .eq("profile_id", profileId)
      .gte("date", today)
      .order("date", { ascending: true });
    if (error) err("listTemporaryAvailability", error);
    return (data ?? []).map((t) => ({ ...t, start: trimTime(t.start), end: trimTime(t.end) }));
  }

  async addTemporaryAvailability(
    input: Omit<TemporaryAvailability, "id" | "created_at">
  ): Promise<TemporaryAvailability> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("temporary_availability").insert(input).select().single();
    if (error) err("addTemporaryAvailability", error);
    return { ...data, start: trimTime(data.start), end: trimTime(data.end) };
  }

  async listAvailabilityRequests(
    organizationId: string,
    opts?: { profileId?: string; status?: AvailabilityRequest["status"][] }
  ): Promise<AvailabilityRequest[]> {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("availability_requests").select("*").eq("organization_id", organizationId);
    if (opts?.profileId) query = query.or(`requested_of.eq.${opts.profileId},requested_by.eq.${opts.profileId}`);
    if (opts?.status?.length) query = query.in("status", opts.status);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) err("listAvailabilityRequests", error);
    return (data ?? []).map((r) => ({ ...r, start: trimTime(r.start), end: trimTime(r.end) }));
  }

  async createAvailabilityRequest(
    input: Omit<AvailabilityRequest, "id" | "created_at">
  ): Promise<AvailabilityRequest> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("availability_requests").insert(input).select().single();
    if (error) err("createAvailabilityRequest", error);
    return { ...data, start: trimTime(data.start), end: trimTime(data.end) };
  }

  async respondAvailabilityRequest(
    id: string,
    status: "accepted" | "declined" | "rescheduled",
    note?: string,
    alternative?: { date: string; start: string; end: string }
  ): Promise<AvailabilityRequest> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("availability_requests")
      .update({
        status,
        response_note: note ?? null,
        proposed_alternative: alternative ?? null,
        responded_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) err("respondAvailabilityRequest", error);
    return { ...data, start: trimTime(data.start), end: trimTime(data.end) };
  }

  // -- Calendar --------------------------------------------------------------------

  async listCalendarEvents(
    organizationId: string,
    opts?: { projectId?: string; from?: string; to?: string }
  ): Promise<CalendarEvent[]> {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("calendar_events").select("*").eq("organization_id", organizationId);
    if (opts?.projectId) query = query.eq("project_id", opts.projectId);
    if (opts?.from) query = query.gte("start", opts.from);
    if (opts?.to) query = query.lte("start", opts.to);
    const { data, error } = await query.order("start", { ascending: true });
    if (error) err("listCalendarEvents", error);
    return data ?? [];
  }

  async createCalendarEvent(input: Omit<CalendarEvent, "id" | "created_at">): Promise<CalendarEvent> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("calendar_events").insert(input).select().single();
    if (error) err("createCalendarEvent", error);
    return data;
  }

  // -- Notifications --------------------------------------------------------------

  async listNotifications(profileId: string, opts?: { unreadOnly?: boolean }): Promise<Notification[]> {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("notifications").select("*").eq("profile_id", profileId);
    if (opts?.unreadOnly) query = query.eq("read", false);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) err("listNotifications", error);
    return data ?? [];
  }

  async markNotificationRead(id: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (error) err("markNotificationRead", error);
  }

  async markAllNotificationsRead(profileId: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("notifications").update({ read: true }).eq("profile_id", profileId);
    if (error) err("markAllNotificationsRead", error);
  }

  async createNotification(input: Omit<Notification, "id" | "created_at" | "read">): Promise<Notification> {
    const supabase = await createServerSupabaseClient();
    // Deliberately does NOT select the row back after inserting: notifications
    // are private to their recipient (see notifications_select_own in
    // 0002_rls_policies.sql), so whenever the person creating a notification
    // is notifying someone ELSE (which is the normal case — a client
    // notifying their admin, or vice versa), they are correctly not allowed
    // to read that row back. Asking Supabase to return the inserted row
    // (.select().single()) then finds zero visible rows and throws, even
    // though the insert itself already succeeded — which was silently
    // breaking the entire calling action (e.g. "couldn't post your comment"
    // even though the comment itself had already saved). We don't need the
    // row back here, so we just construct it ourselves instead.
    const id = randomUUID();
    const created_at = new Date().toISOString();
    const { error } = await supabase.from("notifications").insert({ ...input, id, read: false, created_at });
    if (error) err("createNotification", error);
    return { ...input, id, read: false, created_at };
  }

  // -- Activity --------------------------------------------------------------------

  async listActivity(
    organizationId: string,
    opts?: { projectId?: string; entityId?: string; limit?: number }
  ): Promise<ActivityLog[]> {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("activity_log").select("*").eq("organization_id", organizationId);
    if (opts?.projectId) query = query.eq("project_id", opts.projectId);
    if (opts?.entityId) query = query.eq("entity_id", opts.entityId);
    query = query.order("created_at", { ascending: false });
    if (opts?.limit) query = query.limit(opts.limit);
    const { data, error } = await query;
    if (error) err("listActivity", error);
    return data ?? [];
  }

  async logActivity(input: Omit<ActivityLog, "id" | "created_at">): Promise<ActivityLog> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("activity_log").insert(input).select().single();
    if (error) err("logActivity", error);
    return data;
  }

  // -- Integrations --------------------------------------------------------------

  async listIntegrations(organizationId: string, profileId?: string): Promise<Integration[]> {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("integrations").select("*").eq("organization_id", organizationId);
    if (profileId) query = query.or(`profile_id.is.null,profile_id.eq.${profileId}`);
    const { data, error } = await query;
    if (error) err("listIntegrations", error);
    return data ?? [];
  }

  async upsertIntegration(input: Integration): Promise<Integration> {
    const supabase = await createServerSupabaseClient();
    let existingQuery = supabase
      .from("integrations")
      .select("id")
      .eq("organization_id", input.organization_id)
      .eq("provider", input.provider);
    existingQuery = input.profile_id
      ? existingQuery.eq("profile_id", input.profile_id)
      : existingQuery.is("profile_id", null);
    const { data: existing, error: findErr } = await existingQuery.maybeSingle();
    if (findErr) err("upsertIntegration (lookup)", findErr);

    if (!existing) {
      const { id: _ignoredId, ...rest } = input;
      const insertPayload = input.id ? input : rest;
      const { data, error } = await supabase.from("integrations").insert(insertPayload).select().single();
      if (error) err("upsertIntegration (insert)", error);
      return data;
    }
    const { id: _ignored, ...patch } = input;
    const { data, error } = await supabase
      .from("integrations")
      .update(patch)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) err("upsertIntegration (update)", error);
    return data;
  }

  // -- Search -----------------------------------------------------------------------

  async globalSearch(organizationId: string, query: string) {
    const supabase = await createServerSupabaseClient();
    const q = query.trim();
    if (!q) {
      return { projects: [], tasks: [], topics: [], files: [], issues: [], clients: [] };
    }
    const like = `%${q}%`;
    const [projects, tasks, topics, files, issues, clients] = await Promise.all([
      supabase.from("projects").select("*").eq("organization_id", organizationId).ilike("name", like),
      supabase
        .from("tasks")
        .select("*")
        .eq("organization_id", organizationId)
        .or(`title.ilike.${like},description.ilike.${like}`),
      supabase.from("topics").select("*").eq("organization_id", organizationId).ilike("title", like),
      supabase.from("files").select("*").eq("organization_id", organizationId).ilike("name", like),
      supabase
        .from("issues")
        .select("*")
        .eq("organization_id", organizationId)
        .or(`title.ilike.${like},description.ilike.${like}`),
      supabase.from("clients").select("*").eq("organization_id", organizationId).ilike("company_name", like),
    ]);
    for (const [name, result] of Object.entries({ projects, tasks, topics, files, issues, clients })) {
      if (result.error) err(`globalSearch (${name})`, result.error);
    }
    return {
      projects: projects.data ?? [],
      tasks: tasks.data ?? [],
      topics: topics.data ?? [],
      files: files.data ?? [],
      issues: issues.data ?? [],
      clients: clients.data ?? [],
    };
  }
}

export const supabaseRepository: Repository = new SupabaseRepository();
