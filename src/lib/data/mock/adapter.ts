import { getStore, nextId, type Store } from "./store";
import { buildSeed } from "./seed";
import { getSessionProfileId } from "./session";
import type { Repository, CurrentUser } from "@/lib/data/repository";
import type {
  Approval,
  Issue,
  Payment,
  Project,
  ProjectHealthResult,
  Task,
} from "@/types/domain";

function ensureSeeded(): Store {
  const store = getStore();
  if (store.organizations.length === 0) {
    const seeded = buildSeed();
    Object.assign(store, seeded);
  }
  return store;
}

/** Mirrors the "on delete cascade" chains in supabase/migrations/0001_schema.sql for a project. */
function cascadeDeleteProject(store: Store, projectId: string) {
  const taskIds = new Set(store.tasks.filter((t) => t.project_id === projectId).map((t) => t.id));
  const issueIds = new Set(store.issues.filter((i) => i.project_id === projectId).map((i) => i.id));

  store.taskComments = store.taskComments.filter((c) => !taskIds.has(c.task_id));
  store.taskTags = store.taskTags.filter((t) => !taskIds.has(t.task_id));
  store.issueComments = store.issueComments.filter((c) => !issueIds.has(c.issue_id));
  store.tasks = store.tasks.filter((t) => t.project_id !== projectId);
  store.issues = store.issues.filter((i) => i.project_id !== projectId);
  store.topics = store.topics.filter((t) => t.project_id !== projectId);
  store.files = store.files.filter((f) => f.project_id !== projectId);
  store.approvals = store.approvals.filter((a) => a.project_id !== projectId);
  store.projectMembers = store.projectMembers.filter((m) => m.project_id !== projectId);
  store.projectSettings = store.projectSettings.filter((s) => s.project_id !== projectId);
  store.calendarEvents = store.calendarEvents.filter((e) => e.project_id !== projectId);
  store.payments = store.payments.filter((p) => p.project_id !== projectId);
  store.projects = store.projects.filter((p) => p.id !== projectId);
}

function computeProjectHealth(store: Store, projectId: string): ProjectHealthResult {
  const now = Date.now();
  const tasks = store.tasks.filter((t) => t.project_id === projectId);
  const overdue = tasks.filter(
    (t) => t.deadline && new Date(t.deadline).getTime() < now && t.status !== "completed" && t.status !== "cancelled"
  );
  const blocked = tasks.filter((t) => t.status === "blocked" || t.status === "corrections_required");
  const openIssues = store.issues.filter(
    (i) => i.project_id === projectId && (i.status === "open" || i.status === "in_progress" || i.status === "waiting")
  );
  const pendingApprovals = store.approvals.filter(
    (a) => a.project_id === projectId && a.status === "waiting_client"
  );

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

function matchesQuery(haystack: string | null | undefined, query: string) {
  return !!haystack && haystack.toLowerCase().includes(query.toLowerCase());
}

class MockRepository implements Repository {
  async getCurrentUser(): Promise<CurrentUser | null> {
    const store = ensureSeeded();
    const id = (await getSessionProfileId()) ?? store.currentProfileId;
    if (!id) return null;
    const profile = store.profiles.find((p) => p.id === id);
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

  async getOrganization(id: string) {
    const store = ensureSeeded();
    return store.organizations.find((o) => o.id === id) ?? null;
  }

  async updateOrganization(id: string, patch: Parameters<Repository["updateOrganization"]>[1]) {
    const store = ensureSeeded();
    const idx = store.organizations.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error("Organization not found");
    store.organizations[idx] = { ...store.organizations[idx], ...patch };
    return store.organizations[idx];
  }

  async listProfiles(organizationId: string) {
    const store = ensureSeeded();
    return store.profiles.filter((p) => p.organization_id === organizationId);
  }

  async getProfile(id: string) {
    const store = ensureSeeded();
    return store.profiles.find((p) => p.id === id) ?? null;
  }

  async createProfile(input: Parameters<Repository["createProfile"]>[0]) {
    const store = ensureSeeded();
    const profile = { ...input, id: nextId("prof"), created_at: new Date().toISOString() };
    store.profiles.push(profile);
    return profile;
  }

  async updateProfile(id: string, patch: Parameters<Repository["updateProfile"]>[1]) {
    const store = ensureSeeded();
    const idx = store.profiles.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Profile not found");
    store.profiles[idx] = { ...store.profiles[idx], ...patch };
    return store.profiles[idx];
  }

  async listClients(organizationId: string) {
    const store = ensureSeeded();
    return store.clients.filter((c) => c.organization_id === organizationId);
  }

  async getClient(id: string) {
    const store = ensureSeeded();
    return store.clients.find((c) => c.id === id) ?? null;
  }

  async getClientByProfileId(profileId: string) {
    const store = ensureSeeded();
    return store.clients.find((c) => c.profile_id === profileId) ?? null;
  }

  async createClient(input: Parameters<Repository["createClient"]>[0]) {
    const store = ensureSeeded();
    const client = { ...input, id: nextId("cli"), created_at: new Date().toISOString() };
    store.clients.push(client);
    return client;
  }

  async updateClient(id: string, patch: Parameters<Repository["updateClient"]>[1]) {
    const store = ensureSeeded();
    const idx = store.clients.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Client not found");
    store.clients[idx] = { ...store.clients[idx], ...patch };
    return store.clients[idx];
  }

  async deleteClient(id: string) {
    const store = ensureSeeded();
    // Mirrors clients_id -> projects.client_id "on delete cascade": every
    // project belonging to this client goes too (and everything cascaded
    // from those projects). The client's login/profile is left alone —
    // only the profiles -> clients direction cascades, not this one.
    for (const project of store.projects.filter((p) => p.client_id === id)) {
      cascadeDeleteProject(store, project.id);
    }
    store.payments = store.payments.filter((p) => p.client_id !== id);
    store.clients = store.clients.filter((c) => c.id !== id);
  }

  async listProjects(organizationId: string, opts?: { clientId?: string; profileId?: string }) {
    const store = ensureSeeded();
    let projects = store.projects.filter((p) => p.organization_id === organizationId);
    if (opts?.clientId) projects = projects.filter((p) => p.client_id === opts.clientId);
    if (opts?.profileId) {
      const memberProjectIds = new Set(
        store.projectMembers.filter((m) => m.profile_id === opts.profileId).map((m) => m.project_id)
      );
      projects = projects.filter((p) => memberProjectIds.has(p.id));
    }
    return projects.sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""));
  }

  async getProject(id: string) {
    const store = ensureSeeded();
    return store.projects.find((p) => p.id === id) ?? null;
  }

  async createProject(input: Parameters<Repository["createProject"]>[0]) {
    const store = ensureSeeded();
    const project: Project = {
      ...input,
      id: nextId("proj"),
      progress: 0,
      created_at: new Date().toISOString(),
    };
    store.projects.push(project);
    store.projectSettings.push({
      project_id: project.id,
      drive_structure_created: false,
      client_can_upload: true,
      client_can_see_internal_notes: false,
      notify_on_client_comment: true,
    });
    return project;
  }

  async updateProject(id: string, patch: Partial<Project>) {
    const store = ensureSeeded();
    const idx = store.projects.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Project not found");
    store.projects[idx] = { ...store.projects[idx], ...patch };
    return store.projects[idx];
  }

  async deleteProject(id: string) {
    const store = ensureSeeded();
    cascadeDeleteProject(store, id);
  }

  async listProjectMembers(projectId: string) {
    const store = ensureSeeded();
    return store.projectMembers.filter((m) => m.project_id === projectId);
  }

  async addProjectMember(input: Parameters<Repository["addProjectMember"]>[0]) {
    const store = ensureSeeded();
    const member = { ...input, id: nextId("pm"), created_at: new Date().toISOString() };
    store.projectMembers.push(member);
    return member;
  }

  async getProjectSettings(projectId: string) {
    const store = ensureSeeded();
    return store.projectSettings.find((s) => s.project_id === projectId) ?? null;
  }

  async getProjectHealth(projectId: string) {
    const store = ensureSeeded();
    return computeProjectHealth(store, projectId);
  }

  async listTasks(organizationId: string, filters?: Parameters<Repository["listTasks"]>[1]) {
    const store = ensureSeeded();
    let tasks = store.tasks.filter((t) => t.organization_id === organizationId);
    if (filters?.projectId) tasks = tasks.filter((t) => t.project_id === filters.projectId);
    if (filters?.assigneeId) tasks = tasks.filter((t) => t.assignee_id === filters.assigneeId);
    if (filters?.status?.length) tasks = tasks.filter((t) => filters.status!.includes(t.status));
    if (filters?.waitingFor) tasks = tasks.filter((t) => t.waiting_for === filters.waitingFor);
    if (filters?.topicId) tasks = tasks.filter((t) => t.topic_id === filters.topicId);
    return tasks.sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"));
  }

  async getTask(id: string) {
    const store = ensureSeeded();
    return store.tasks.find((t) => t.id === id) ?? null;
  }

  async createTask(input: Parameters<Repository["createTask"]>[0]) {
    const store = ensureSeeded();
    const now = new Date().toISOString();
    const position = store.tasks.filter((t) => t.project_id === input.project_id).length + 1;
    const task: Task = { ...input, id: nextId("task"), position, created_at: now, updated_at: now };
    store.tasks.push(task);
    return task;
  }

  async updateTask(id: string, patch: Partial<Task>) {
    const store = ensureSeeded();
    const idx = store.tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("Task not found");
    store.tasks[idx] = { ...store.tasks[idx], ...patch, updated_at: new Date().toISOString() };
    return store.tasks[idx];
  }

  async deleteTask(id: string) {
    const store = ensureSeeded();
    store.tasks = store.tasks.filter((t) => t.id !== id);
  }

  async listTaskComments(taskId: string) {
    const store = ensureSeeded();
    return store.taskComments
      .filter((c) => c.task_id === taskId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  async addTaskComment(input: Parameters<Repository["addTaskComment"]>[0]) {
    const store = ensureSeeded();
    const comment = { ...input, id: nextId("tc"), created_at: new Date().toISOString() };
    store.taskComments.push(comment);
    return comment;
  }

  async listTags(organizationId: string) {
    const store = ensureSeeded();
    return store.tags.filter((t) => t.organization_id === organizationId);
  }

  async getTaskTags(taskId: string) {
    const store = ensureSeeded();
    const tagIds = new Set(store.taskTags.filter((tt) => tt.task_id === taskId).map((tt) => tt.tag_id));
    return store.tags.filter((t) => tagIds.has(t.id));
  }

  async listTopics(organizationId: string, opts?: { projectId?: string }) {
    const store = ensureSeeded();
    let topics = store.topics.filter((t) => t.organization_id === organizationId);
    if (opts?.projectId) topics = topics.filter((t) => t.project_id === opts.projectId);
    return topics.sort((a, b) => a.position - b.position);
  }

  async getTopic(id: string) {
    const store = ensureSeeded();
    return store.topics.find((t) => t.id === id) ?? null;
  }

  async createTopic(input: Parameters<Repository["createTopic"]>[0]) {
    const store = ensureSeeded();
    const position = store.topics.filter((t) => t.project_id === input.project_id).length + 1;
    const topic = { ...input, id: nextId("topic"), position, created_at: new Date().toISOString() };
    store.topics.push(topic);
    return topic;
  }

  async updateTopic(id: string, patch: Parameters<Repository["updateTopic"]>[1]) {
    const store = ensureSeeded();
    const idx = store.topics.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("Topic not found");
    store.topics[idx] = { ...store.topics[idx], ...patch };
    return store.topics[idx];
  }

  async getNextTopic(organizationId: string, projectId?: string) {
    const store = ensureSeeded();
    let topics = store.topics.filter(
      (t) => t.organization_id === organizationId && (t.status === "ready_to_start" || t.status === "idea")
    );
    if (projectId) topics = topics.filter((t) => t.project_id === projectId);
    topics.sort((a, b) => {
      if (a.status !== b.status) return a.status === "ready_to_start" ? -1 : 1;
      return (a.expected_start ?? "9999").localeCompare(b.expected_start ?? "9999");
    });
    return topics[0] ?? null;
  }

  async listIssues(organizationId: string, opts?: { projectId?: string; status?: Issue["status"][] }) {
    const store = ensureSeeded();
    let issues = store.issues.filter((i) => i.organization_id === organizationId);
    if (opts?.projectId) issues = issues.filter((i) => i.project_id === opts.projectId);
    if (opts?.status?.length) issues = issues.filter((i) => opts.status!.includes(i.status));
    return issues.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async getIssue(id: string) {
    const store = ensureSeeded();
    return store.issues.find((i) => i.id === id) ?? null;
  }

  async createIssue(input: Parameters<Repository["createIssue"]>[0]) {
    const store = ensureSeeded();
    const issue = { ...input, id: nextId("issue"), created_at: new Date().toISOString() };
    store.issues.push(issue);
    return issue;
  }

  async updateIssue(id: string, patch: Partial<Issue>) {
    const store = ensureSeeded();
    const idx = store.issues.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error("Issue not found");
    store.issues[idx] = { ...store.issues[idx], ...patch };
    return store.issues[idx];
  }

  async deleteIssue(id: string) {
    const store = ensureSeeded();
    store.issueComments = store.issueComments.filter((c) => c.issue_id !== id);
    store.issues = store.issues.filter((i) => i.id !== id);
  }

  async listIssueComments(issueId: string) {
    const store = ensureSeeded();
    return store.issueComments
      .filter((c) => c.issue_id === issueId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  async addIssueComment(input: Parameters<Repository["addIssueComment"]>[0]) {
    const store = ensureSeeded();
    const comment = { ...input, id: nextId("ic"), created_at: new Date().toISOString() };
    store.issueComments.push(comment);
    return comment;
  }

  async listFiles(organizationId: string, opts?: { projectId?: string; category?: string }) {
    const store = ensureSeeded();
    let files = store.files.filter((f) => f.organization_id === organizationId);
    if (opts?.projectId) files = files.filter((f) => f.project_id === opts.projectId);
    if (opts?.category) files = files.filter((f) => f.category === opts.category);
    return files.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async createFile(input: Parameters<Repository["createFile"]>[0]) {
    const store = ensureSeeded();
    const file = { ...input, id: nextId("file"), version: 1, created_at: new Date().toISOString() };
    store.files.push(file);
    return file;
  }

  async deleteFile(id: string) {
    const store = ensureSeeded();
    store.files = store.files.filter((f) => f.id !== id);
  }

  async listApprovals(organizationId: string, opts?: { projectId?: string; status?: Approval["status"][] }) {
    const store = ensureSeeded();
    let approvals = store.approvals.filter((a) => a.organization_id === organizationId);
    if (opts?.projectId) approvals = approvals.filter((a) => a.project_id === opts.projectId);
    if (opts?.status?.length) approvals = approvals.filter((a) => opts.status!.includes(a.status));
    return approvals.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async getApproval(id: string) {
    const store = ensureSeeded();
    return store.approvals.find((a) => a.id === id) ?? null;
  }

  async createApproval(input: Parameters<Repository["createApproval"]>[0]) {
    const store = ensureSeeded();
    const approval = { ...input, id: nextId("appr"), created_at: new Date().toISOString() };
    store.approvals.push(approval);
    return approval;
  }

  async decideApproval(id: string, decision: "approved" | "changes_requested", decidedBy: string, feedback?: string) {
    const store = ensureSeeded();
    const idx = store.approvals.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Approval not found");
    store.approvals[idx] = {
      ...store.approvals[idx],
      status: decision,
      decided_by: decidedBy,
      feedback: feedback ?? store.approvals[idx].feedback,
      decided_at: new Date().toISOString(),
    };
    const approval = store.approvals[idx];

    // Cascade: update the linked task's status per the Client Review Flow (spec section 57/24)
    if (approval.task_id) {
      const taskIdx = store.tasks.findIndex((t) => t.id === approval.task_id);
      if (taskIdx !== -1) {
        if (decision === "approved") {
          store.tasks[taskIdx] = {
            ...store.tasks[taskIdx],
            status: "completed",
            waiting_for: "nobody",
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        } else {
          store.tasks[taskIdx] = {
            ...store.tasks[taskIdx],
            status: "corrections_required",
            waiting_for: "me",
            waiting_for_profile_id: store.tasks[taskIdx].assignee_id,
            updated_at: new Date().toISOString(),
          };
        }
      }
    }
    return approval;
  }

  async listPayments(
    organizationId: string,
    opts?: { projectId?: string; clientId?: string; status?: Payment["status"][] }
  ) {
    const store = ensureSeeded();
    let payments = store.payments.filter((p) => p.organization_id === organizationId);
    if (opts?.projectId) payments = payments.filter((p) => p.project_id === opts.projectId);
    if (opts?.clientId) payments = payments.filter((p) => p.client_id === opts.clientId);
    if (opts?.status?.length) payments = payments.filter((p) => opts.status!.includes(p.status));
    return payments.sort((a, b) => b.issued_date.localeCompare(a.issued_date));
  }

  async getPayment(id: string) {
    const store = ensureSeeded();
    return store.payments.find((p) => p.id === id) ?? null;
  }

  async createPayment(input: Parameters<Repository["createPayment"]>[0]) {
    const store = ensureSeeded();
    const payment: Payment = { ...input, id: nextId("pay"), created_at: new Date().toISOString() };
    store.payments.push(payment);
    return payment;
  }

  async updatePayment(id: string, patch: Partial<Payment>) {
    const store = ensureSeeded();
    const idx = store.payments.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Payment not found");
    store.payments[idx] = { ...store.payments[idx], ...patch };
    return store.payments[idx];
  }

  async getAvailability(profileId: string) {
    const store = ensureSeeded();
    return store.availability.find((a) => a.profile_id === profileId) ?? null;
  }

  async upsertAvailability(input: Parameters<Repository["upsertAvailability"]>[0]) {
    const store = ensureSeeded();
    const idx = store.availability.findIndex((a) => a.profile_id === input.profile_id);
    const record = { ...input, updated_at: new Date().toISOString() };
    if (idx === -1) store.availability.push(record);
    else store.availability[idx] = record;
    return record;
  }

  async listTemporaryAvailability(profileId: string) {
    const store = ensureSeeded();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return store.temporaryAvailability
      .filter((t) => t.profile_id === profileId && new Date(t.date) >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async addTemporaryAvailability(input: Parameters<Repository["addTemporaryAvailability"]>[0]) {
    const store = ensureSeeded();
    const record = { ...input, id: nextId("temp"), created_at: new Date().toISOString() };
    store.temporaryAvailability.push(record);
    return record;
  }

  async listAvailabilityRequests(
    organizationId: string,
    opts?: { profileId?: string; status?: Parameters<Repository["listAvailabilityRequests"]>[1] extends infer T
      ? T extends { status?: infer S }
        ? S
        : never
      : never }
  ) {
    const store = ensureSeeded();
    let requests = store.availabilityRequests.filter((r) => r.organization_id === organizationId);
    if (opts?.profileId)
      requests = requests.filter((r) => r.requested_of === opts.profileId || r.requested_by === opts.profileId);
    if (opts?.status?.length) requests = requests.filter((r) => (opts.status as string[]).includes(r.status));
    return requests.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async createAvailabilityRequest(input: Parameters<Repository["createAvailabilityRequest"]>[0]) {
    const store = ensureSeeded();
    const request = { ...input, id: nextId("areq"), created_at: new Date().toISOString() };
    store.availabilityRequests.push(request);
    return request;
  }

  async respondAvailabilityRequest(
    id: string,
    status: "accepted" | "declined" | "rescheduled",
    note?: string,
    alternative?: { date: string; start: string; end: string }
  ) {
    const store = ensureSeeded();
    const idx = store.availabilityRequests.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Request not found");
    store.availabilityRequests[idx] = {
      ...store.availabilityRequests[idx],
      status,
      response_note: note ?? null,
      proposed_alternative: alternative ?? null,
      responded_at: new Date().toISOString(),
    };
    return store.availabilityRequests[idx];
  }

  async listCalendarEvents(organizationId: string, opts?: { projectId?: string; from?: string; to?: string }) {
    const store = ensureSeeded();
    let events = store.calendarEvents.filter((e) => e.organization_id === organizationId);
    if (opts?.projectId) events = events.filter((e) => e.project_id === opts.projectId);
    if (opts?.from) events = events.filter((e) => e.start >= opts.from!);
    if (opts?.to) events = events.filter((e) => e.start <= opts.to!);
    return events.sort((a, b) => a.start.localeCompare(b.start));
  }

  async createCalendarEvent(input: Parameters<Repository["createCalendarEvent"]>[0]) {
    const store = ensureSeeded();
    const event = { ...input, id: nextId("cal"), created_at: new Date().toISOString() };
    store.calendarEvents.push(event);
    return event;
  }

  async listNotifications(profileId: string, opts?: { unreadOnly?: boolean }) {
    const store = ensureSeeded();
    let notifs = store.notifications.filter((n) => n.profile_id === profileId);
    if (opts?.unreadOnly) notifs = notifs.filter((n) => !n.read);
    return notifs.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async markNotificationRead(id: string) {
    const store = ensureSeeded();
    const idx = store.notifications.findIndex((n) => n.id === id);
    if (idx !== -1) store.notifications[idx] = { ...store.notifications[idx], read: true };
  }

  async markAllNotificationsRead(profileId: string) {
    const store = ensureSeeded();
    store.notifications = store.notifications.map((n) =>
      n.profile_id === profileId ? { ...n, read: true } : n
    );
  }

  async createNotification(input: Parameters<Repository["createNotification"]>[0]) {
    const store = ensureSeeded();
    const notif = { ...input, id: nextId("notif"), read: false, created_at: new Date().toISOString() };
    store.notifications.push(notif);
    return notif;
  }

  async listActivity(organizationId: string, opts?: { projectId?: string; entityId?: string; limit?: number }) {
    const store = ensureSeeded();
    let logs = store.activityLog.filter((a) => a.organization_id === organizationId);
    if (opts?.projectId) logs = logs.filter((a) => a.project_id === opts.projectId);
    if (opts?.entityId) logs = logs.filter((a) => a.entity_id === opts.entityId);
    logs = logs.sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (opts?.limit) logs = logs.slice(0, opts.limit);
    return logs;
  }

  async logActivity(input: Parameters<Repository["logActivity"]>[0]) {
    const store = ensureSeeded();
    const log = { ...input, id: nextId("act"), created_at: new Date().toISOString() };
    store.activityLog.push(log);
    return log;
  }

  async listIntegrations(organizationId: string, profileId?: string) {
    const store = ensureSeeded();
    let integrations = store.integrations.filter((i) => i.organization_id === organizationId);
    if (profileId) integrations = integrations.filter((i) => !i.profile_id || i.profile_id === profileId);
    return integrations;
  }

  async upsertIntegration(input: Parameters<Repository["upsertIntegration"]>[0]) {
    const store = ensureSeeded();
    const idx = store.integrations.findIndex(
      (i) => i.provider === input.provider && i.profile_id === input.profile_id
    );
    if (idx === -1) {
      const record = { ...input, id: input.id || nextId("int") };
      store.integrations.push(record);
      return record;
    }
    store.integrations[idx] = { ...store.integrations[idx], ...input, id: store.integrations[idx].id };
    return store.integrations[idx];
  }

  async globalSearch(organizationId: string, query: string) {
    const store = ensureSeeded();
    const q = query.trim();
    if (!q) {
      return { projects: [], tasks: [], topics: [], files: [], issues: [], clients: [] };
    }
    return {
      projects: store.projects.filter(
        (p) => p.organization_id === organizationId && matchesQuery(p.name, q)
      ),
      tasks: store.tasks.filter(
        (t) => t.organization_id === organizationId && (matchesQuery(t.title, q) || matchesQuery(t.description, q))
      ),
      topics: store.topics.filter(
        (t) => t.organization_id === organizationId && matchesQuery(t.title, q)
      ),
      files: store.files.filter(
        (f) => f.organization_id === organizationId && matchesQuery(f.name, q)
      ),
      issues: store.issues.filter(
        (i) => i.organization_id === organizationId && (matchesQuery(i.title, q) || matchesQuery(i.description, q))
      ),
      clients: store.clients.filter(
        (c) => c.organization_id === organizationId && matchesQuery(c.company_name, q)
      ),
    };
  }
}

export const mockRepository = new MockRepository();
