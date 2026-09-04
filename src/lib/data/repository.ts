import type {
  Approval,
  ActivityLog,
  AvailabilityRequest,
  Availability,
  CalendarEvent,
  Client,
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
  TemporaryAvailability,
  Topic,
  UserRole,
} from "@/types/domain";

// ============================================================================
// Repository contract. Two implementations exist:
//  - MockRepository (src/lib/data/mock/adapter.ts) — in-memory, seeded with
//    realistic demo data, zero external dependencies. This is the default so
//    the product works immediately with `npm run dev`.
//  - SupabaseRepository (src/lib/data/supabase/adapter.ts) — talks to a real
//    Supabase project (Postgres + Auth + Storage) using the schema in
//    supabase/migrations. Activate it by setting DATA_BACKEND=supabase and
//    the NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY env vars.
//
// Swapping backends never requires touching UI code — every server
// component / server action goes through getRepository() in
// src/lib/data/index.ts.
// ============================================================================

export interface CurrentUser {
  id: string;
  organizationId: string;
  role: UserRole;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  timezone: string;
}

export interface Repository {
  // -- Auth / session (mock adapter simulates; supabase adapter delegates to Supabase Auth)
  getCurrentUser(): Promise<CurrentUser | null>;

  // -- Organizations / profiles
  getOrganization(id: string): Promise<Organization | null>;
  updateOrganization(id: string, patch: Partial<Organization>): Promise<Organization>;
  listProfiles(organizationId: string): Promise<Profile[]>;
  getProfile(id: string): Promise<Profile | null>;
  createProfile(input: Omit<Profile, "id" | "created_at">): Promise<Profile>;
  updateProfile(id: string, patch: Partial<Profile>): Promise<Profile>;

  // -- Clients
  listClients(organizationId: string): Promise<Client[]>;
  getClient(id: string): Promise<Client | null>;
  getClientByProfileId(profileId: string): Promise<Client | null>;
  createClient(input: Omit<Client, "id" | "created_at">): Promise<Client>;
  updateClient(id: string, patch: Partial<Client>): Promise<Client>;
  deleteClient(id: string): Promise<void>;

  // -- Projects
  listProjects(organizationId: string, opts?: { clientId?: string; profileId?: string }): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(input: Omit<Project, "id" | "created_at" | "progress">): Promise<Project>;
  updateProject(id: string, patch: Partial<Project>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  listProjectMembers(projectId: string): Promise<ProjectMember[]>;
  addProjectMember(input: Omit<ProjectMember, "id" | "created_at">): Promise<ProjectMember>;
  getProjectSettings(projectId: string): Promise<ProjectSettings | null>;
  getProjectHealth(projectId: string): Promise<ProjectHealthResult>;

  // -- Tasks
  listTasks(
    organizationId: string,
    filters?: {
      projectId?: string;
      assigneeId?: string;
      status?: Task["status"][];
      waitingFor?: Task["waiting_for"];
      topicId?: string;
    }
  ): Promise<Task[]>;
  getTask(id: string): Promise<Task | null>;
  createTask(input: Omit<Task, "id" | "created_at" | "updated_at" | "position">): Promise<Task>;
  updateTask(id: string, patch: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  listTaskComments(taskId: string): Promise<TaskComment[]>;
  addTaskComment(input: Omit<TaskComment, "id" | "created_at">): Promise<TaskComment>;
  listTags(organizationId: string): Promise<Tag[]>;
  getTaskTags(taskId: string): Promise<Tag[]>;

  // -- Topics
  listTopics(organizationId: string, opts?: { projectId?: string }): Promise<Topic[]>;
  getTopic(id: string): Promise<Topic | null>;
  createTopic(input: Omit<Topic, "id" | "created_at" | "position">): Promise<Topic>;
  updateTopic(id: string, patch: Partial<Topic>): Promise<Topic>;
  getNextTopic(organizationId: string, projectId?: string): Promise<Topic | null>;

  // -- Issues
  listIssues(organizationId: string, opts?: { projectId?: string; status?: Issue["status"][] }): Promise<Issue[]>;
  getIssue(id: string): Promise<Issue | null>;
  createIssue(input: Omit<Issue, "id" | "created_at">): Promise<Issue>;
  updateIssue(id: string, patch: Partial<Issue>): Promise<Issue>;
  deleteIssue(id: string): Promise<void>;
  listIssueComments(issueId: string): Promise<IssueComment[]>;
  addIssueComment(input: Omit<IssueComment, "id" | "created_at">): Promise<IssueComment>;

  // -- Files
  listFiles(organizationId: string, opts?: { projectId?: string; category?: string }): Promise<ProjectFile[]>;
  createFile(input: Omit<ProjectFile, "id" | "created_at" | "version">): Promise<ProjectFile>;
  deleteFile(id: string): Promise<void>;

  // -- Approvals
  listApprovals(organizationId: string, opts?: { projectId?: string; status?: Approval["status"][] }): Promise<Approval[]>;
  getApproval(id: string): Promise<Approval | null>;
  createApproval(input: Omit<Approval, "id" | "created_at">): Promise<Approval>;
  decideApproval(id: string, decision: "approved" | "changes_requested", decidedBy: string, feedback?: string): Promise<Approval>;

  // -- Payments
  listPayments(organizationId: string, opts?: { projectId?: string; clientId?: string; status?: PaymentStatus[] }): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | null>;
  createPayment(input: Omit<Payment, "id" | "created_at">): Promise<Payment>;
  updatePayment(id: string, patch: Partial<Payment>): Promise<Payment>;

  // -- Availability
  getAvailability(profileId: string): Promise<Availability | null>;
  upsertAvailability(input: Availability): Promise<Availability>;
  listTemporaryAvailability(profileId: string): Promise<TemporaryAvailability[]>;
  addTemporaryAvailability(input: Omit<TemporaryAvailability, "id" | "created_at">): Promise<TemporaryAvailability>;
  listAvailabilityRequests(organizationId: string, opts?: { profileId?: string; status?: AvailabilityRequest["status"][] }): Promise<AvailabilityRequest[]>;
  createAvailabilityRequest(input: Omit<AvailabilityRequest, "id" | "created_at">): Promise<AvailabilityRequest>;
  respondAvailabilityRequest(
    id: string,
    status: "accepted" | "declined" | "rescheduled",
    note?: string,
    alternative?: { date: string; start: string; end: string }
  ): Promise<AvailabilityRequest>;

  // -- Calendar
  listCalendarEvents(organizationId: string, opts?: { projectId?: string; from?: string; to?: string }): Promise<CalendarEvent[]>;
  createCalendarEvent(input: Omit<CalendarEvent, "id" | "created_at">): Promise<CalendarEvent>;

  // -- Notifications
  listNotifications(profileId: string, opts?: { unreadOnly?: boolean }): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(profileId: string): Promise<void>;
  createNotification(input: Omit<Notification, "id" | "created_at" | "read">): Promise<Notification>;

  // -- Activity
  listActivity(organizationId: string, opts?: { projectId?: string; entityId?: string; limit?: number }): Promise<ActivityLog[]>;
  logActivity(input: Omit<ActivityLog, "id" | "created_at">): Promise<ActivityLog>;

  // -- Integrations
  listIntegrations(organizationId: string, profileId?: string): Promise<Integration[]>;
  upsertIntegration(input: Integration): Promise<Integration>;

  // -- Search
  globalSearch(organizationId: string, query: string): Promise<{
    projects: Project[];
    tasks: Task[];
    topics: Topic[];
    files: ProjectFile[];
    issues: Issue[];
    clients: Client[];
  }>;
}
