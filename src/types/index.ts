export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Blocked';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to?: number | null;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
  assignee_name?: string | null;
  assignee_email?: string | null;
  assignee_avatar?: string | null;
  assignee_role?: string | null;
  comment_count?: number;
}

export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  comment: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
  user_role?: string;
}

export interface ActivityLog {
  id: number;
  task_id?: number | null;
  user_id?: number | null;
  action: string;
  details?: string | null;
  created_at: string;
  user_name?: string;
  task_title?: string;
}

export interface TaskDetailResponse {
  task: Task;
  comments: Comment[];
  activities: ActivityLog[];
}

export interface PaginatedResponse<T> {
  tasks: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TaskFilterParams {
  status?: string;
  priority?: string;
  assignee?: number | string;
  search?: string;
  overdue?: boolean;
  sort_by?: 'due_date' | 'created_at' | 'updated_at' | 'priority' | 'status' | 'title';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface DashboardMetrics {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  assignedToUserTasks: number;
  currentUser: User | null;
  priorityDistribution: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  recentActivities?: ActivityLog[];
  upcomingDeadlines?: Task[];
}

export interface ExternalUserProfile {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  website: string;
  company: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
  address: {
    city: string;
    suite: string;
    street: string;
  };
  department: string;
  suggestedRole: string;
  avatar: string;
  isImported?: boolean;
}

export interface ExternalApiResponse {
  success: boolean;
  data: ExternalUserProfile[];
  source: string;
  latencyMs: number;
  rateLimit: {
    limit: number;
    remaining: number;
    resetInSeconds: number;
  };
  timestamp: string;
  cached?: boolean;
}
