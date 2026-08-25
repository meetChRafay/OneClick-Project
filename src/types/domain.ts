// ============================================================================
// Core domain types — mirrors the Supabase/PostgreSQL schema in
// supabase/migrations. Any adapter (mock or Supabase) implements the
// Repository interface in src/lib/data/repository.ts using these shapes.
// ============================================================================

export type UserRole = "admin" | "client";

export type ID = string;

export interface Organization {
  id: ID;
  name: string;
  created_at: string;
}

export interface Profile {
  id: ID; // = auth user id
  organization_id: ID;
  role: UserRole;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  title?: string | null; // e.g. "Video Editor", job title
  timezone: string; // IANA tz, e.g. "Asia/Karachi"
  phone?: string | null;
  onboarding_completed: boolean;
  notification_prefs?: NotificationPrefs | null;
  created_at: string;
}

export interface NotificationPrefs {
  email: boolean;
  task_assigned: boolean;
  comments_mentions: boolean;
  approvals: boolean;
  deadlines: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  email: true,
  task_assigned: true,
  comments_mentions: true,
  approvals: true,
  deadlines: true,
};

export interface Client {
  id: ID;
  organization_id: ID;
  profile_id: ID; // linked auth profile
  company_name?: string | null;
  notes_internal?: string | null; // admin-only
  created_at: string;
}

export type ProjectStatus =
  | "planning"
  | "active"
  | "needs_attention"
  | "on_hold"
  | "completed"
  | "archived";

export type Priority = "low" | "medium" | "high" | "urgent";

export interface Project {
  id: ID;
  organization_id: ID;
  name: string;
  description?: string | null;
  client_id: ID;
  status: ProjectStatus;
  priority: Priority;
  start_date?: string | null;
  deadline?: string | null;
  progress: number; // 0-100
  cover_color?: string | null;
  drive_folder_id?: string | null;
  drive_folder_url?: string | null;
  created_by: ID;
  created_at: string;
  archived_at?: string | null;
}

export type ProjectMemberRole = "owner" | "manager" | "contributor" | "client";

export interface ProjectMember {
  id: ID;
  project_id: ID;
  profile_id: ID;
  role: ProjectMemberRole;
  created_at: string;
}

export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "internal_review"
  | "client_review"
  | "waiting_client"
  | "waiting_me"
  | "corrections_required"
  | "blocked"
  | "final_approval"
  | "completed"
  | "cancelled";

export type WaitingFor = "me" | "client" | "both" | "nobody";

export interface Task {
  id: ID;
  organization_id: ID;
  project_id: ID;
  topic_id?: ID | null;
  title: string;
  description?: string | null;
  assignee_id?: ID | null;
  creator_id: ID;
  status: TaskStatus;
  priority: Priority;
  deadline?: string | null;
  start_date?: string | null;
  estimated_minutes?: number | null;
  actual_minutes?: number | null;
  waiting_for: WaitingFor;
  waiting_for_profile_id?: ID | null; // specific person, e.g. the client
  position: number; // ordering within status column
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: ID;
  organization_id: ID;
  name: string;
  color: string;
}

export interface TaskTag {
  task_id: ID;
  tag_id: ID;
}

export type Visibility = "internal" | "client_visible";

export interface TaskComment {
  id: ID;
  task_id: ID;
  author_id: ID;
  body: string;
  visibility: Visibility;
  mentioned_profile_ids: ID[];
  created_at: string;
  edited_at?: string | null;
}

export interface TaskAttachment {
  id: ID;
  task_id: ID;
  file_id: ID;
  created_at: string;
}

export type ContentPipelineStage =
  | "ideas"
  | "research"
  | "script"
  | "voiceover"
  | "editing"
  | "review"
  | "corrections"
  | "approved"
  | "published";

export type VideoWorkflowStage =
  | "topic_idea"
  | "topic_approved"
  | "research"
  | "script"
  | "script_review"
  | "voiceover"
  | "visual_production"
  | "editing"
  | "internal_review"
  | "client_review"
  | "corrections"
  | "final_approval"
  | "thumbnail"
  | "seo"
  | "upload"
  | "published";

export type TopicStatus =
  | "idea"
  | "ready_to_start"
  | "in_progress"
  | "in_review"
  | "published";

export interface Topic {
  id: ID;
  organization_id: ID;
  project_id: ID;
  title: string;
  description?: string | null;
  status: TopicStatus;
  pipeline_stage: ContentPipelineStage;
  workflow_stage: VideoWorkflowStage;
  assignee_id?: ID | null;
  priority: Priority;
  expected_start?: string | null;
  published_at?: string | null;
  position: number;
  created_at: string;
}

export interface TopicStageHistory {
  id: ID;
  topic_id: ID;
  stage: VideoWorkflowStage;
  entered_at: string;
  entered_by: ID;
}

export type IssueStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";

export interface Issue {
  id: ID;
  organization_id: ID;
  project_id: ID;
  task_id?: ID | null;
  title: string;
  description?: string | null;
  priority: Priority;
  status: IssueStatus;
  assignee_id?: ID | null;
  reporter_id: ID;
  deadline?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

export interface IssueComment {
  id: ID;
  issue_id: ID;
  author_id: ID;
  body: string;
  visibility: Visibility;
  created_at: string;
}

export type FileCategory =
  | "videos"
  | "scripts"
  | "voiceovers"
  | "images"
  | "thumbnails"
  | "documents"
  | "references"
  | "other";

export interface ProjectFile {
  id: ID;
  organization_id: ID;
  project_id: ID;
  name: string;
  category: FileCategory;
  visibility: Visibility;
  size_bytes?: number | null;
  mime_type?: string | null;
  storage_path?: string | null; // Supabase Storage path
  drive_file_id?: string | null;
  drive_url?: string | null;
  uploaded_by: ID;
  version: number;
  created_at: string;
}

export type ApprovalStatus =
  | "waiting_client"
  | "approved"
  | "changes_requested";

export interface Approval {
  id: ID;
  organization_id: ID;
  project_id: ID;
  task_id?: ID | null;
  topic_id?: ID | null;
  file_id?: ID | null;
  title: string;
  status: ApprovalStatus;
  requested_by: ID;
  decided_by?: ID | null;
  feedback?: string | null;
  created_at: string;
  decided_at?: string | null;
}

export type AvailabilityStatusValue = "available" | "busy" | "away" | "dnd";

export interface DaySchedule {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  enabled: boolean;
  start?: string; // "09:00"
  end?: string; // "18:00"
}

export interface Availability {
  id: ID;
  profile_id: ID;
  status: AvailabilityStatusValue;
  status_message?: string | null;
  timezone: string;
  weekly_schedule: DaySchedule[];
  updated_at: string;
}

export interface TemporaryAvailability {
  id: ID;
  profile_id: ID;
  date: string; // YYYY-MM-DD
  start: string;
  end: string;
  note?: string | null;
  created_at: string;
}

export type AvailabilityRequestStatus = "pending" | "accepted" | "declined" | "rescheduled";

export interface AvailabilityRequest {
  id: ID;
  organization_id: ID;
  project_id?: ID | null;
  requested_by: ID;
  requested_of: ID;
  date: string;
  start: string;
  end: string;
  purpose: string;
  status: AvailabilityRequestStatus;
  response_note?: string | null;
  proposed_alternative?: { date: string; start: string; end: string } | null;
  created_at: string;
  responded_at?: string | null;
}

export type CalendarEventType =
  | "task_deadline"
  | "meeting"
  | "review_session"
  | "publish_date"
  | "milestone"
  | "availability_block";

export interface CalendarEvent {
  id: ID;
  organization_id: ID;
  project_id?: ID | null;
  title: string;
  type: CalendarEventType;
  start: string;
  end: string;
  all_day: boolean;
  location?: string | null;
  attendee_ids: ID[];
  google_event_id?: string | null;
  created_by: ID;
  created_at: string;
}

export type NotificationType =
  | "task_assigned"
  | "task_new"
  | "deadline_approaching"
  | "task_overdue"
  | "new_comment"
  | "mention"
  | "new_file"
  | "approval_request"
  | "approval_received"
  | "availability_request"
  | "issue_created"
  | "issue_resolved"
  | "project_update";

export interface Notification {
  id: ID;
  organization_id: ID;
  profile_id: ID; // recipient
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null; // e.g. /tasks/123
  read: boolean;
  actor_id?: ID | null;
  created_at: string;
}

export type ActivityEntityType =
  | "project"
  | "task"
  | "topic"
  | "issue"
  | "file"
  | "approval"
  | "availability"
  | "client";

export interface ActivityLog {
  id: ID;
  organization_id: ID;
  project_id?: ID | null;
  entity_type: ActivityEntityType;
  entity_id: ID;
  actor_id: ID;
  action: string; // e.g. "uploaded a file", "changed status to Completed"
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export type IntegrationProvider =
  | "google_drive"
  | "google_calendar"
  | "gmail"
  | "google_meet"
  | "slack"
  | "whatsapp"
  | "telegram"
  | "email";

export interface Integration {
  id: ID;
  organization_id: ID;
  profile_id?: ID | null; // per-user connection (e.g. calendar) vs org-wide (e.g. drive)
  provider: IntegrationProvider;
  connected: boolean;
  account_email?: string | null;
  scopes?: string[] | null;
  metadata?: Record<string, unknown> | null;
  connected_at?: string | null;
}

export interface ProjectSettings {
  project_id: ID;
  drive_structure_created: boolean;
  client_can_upload: boolean;
  client_can_see_internal_notes: boolean;
  notify_on_client_comment: boolean;
}

// ---- Derived / computed view models (not raw tables) ----

export type ProjectHealth = "healthy" | "needs_attention" | "at_risk";

export interface ProjectHealthResult {
  health: ProjectHealth;
  reasons: string[];
  overdueCount: number;
  blockedCount: number;
  openIssueCount: number;
  pendingApprovalCount: number;
}

export interface DashboardCounts {
  dueToday: number;
  overdue: number;
  waitingForClient: number;
  waitingForMe: number;
  completedThisWeek: number;
}
