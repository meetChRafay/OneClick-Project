import type {
  Approval,
  ActivityLog,
  Availability,
  AvailabilityRequest,
  CalendarEvent,
  Client,
  Integration,
  Issue,
  IssueComment,
  Notification,
  Organization,
  Payment,
  Profile,
  Project,
  ProjectFile,
  ProjectMember,
  ProjectSettings,
  Tag,
  Task,
  TaskComment,
  TaskTag,
  TemporaryAvailability,
  Topic,
  TopicStageHistory,
} from "@/types/domain";

export interface Store {
  organizations: Organization[];
  profiles: Profile[];
  clients: Client[];
  projects: Project[];
  projectMembers: ProjectMember[];
  projectSettings: ProjectSettings[];
  tasks: Task[];
  taskComments: TaskComment[];
  tags: Tag[];
  taskTags: TaskTag[];
  topics: Topic[];
  topicStageHistory: TopicStageHistory[];
  issues: Issue[];
  issueComments: IssueComment[];
  files: ProjectFile[];
  approvals: Approval[];
  payments: Payment[];
  availability: Availability[];
  temporaryAvailability: TemporaryAvailability[];
  availabilityRequests: AvailabilityRequest[];
  calendarEvents: CalendarEvent[];
  notifications: Notification[];
  activityLog: ActivityLog[];
  integrations: Integration[];
  /** id of the profile currently "logged in" in this demo session */
  currentProfileId: string | null;
}

function emptyStore(): Store {
  return {
    organizations: [],
    profiles: [],
    clients: [],
    projects: [],
    projectMembers: [],
    projectSettings: [],
    tasks: [],
    taskComments: [],
    tags: [],
    taskTags: [],
    topics: [],
    topicStageHistory: [],
    issues: [],
    issueComments: [],
    files: [],
    approvals: [],
    payments: [],
    availability: [],
    temporaryAvailability: [],
    availabilityRequests: [],
    calendarEvents: [],
    notifications: [],
    activityLog: [],
    integrations: [],
    currentProfileId: null,
  };
}

// Use a global so the in-memory store survives Next.js dev-server HMR
// reloads of this module (otherwise every edit would wipe demo data).
const globalForStore = globalThis as unknown as { __projectHubStore?: Store };

export function getStore(): Store {
  if (!globalForStore.__projectHubStore) {
    globalForStore.__projectHubStore = emptyStore();
  }
  return globalForStore.__projectHubStore;
}

export function resetStore(seeded: Store) {
  globalForStore.__projectHubStore = seeded;
}

let idCounter = 0;
export function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${idCounter}`;
}
