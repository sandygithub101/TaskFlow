export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Blocked';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
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
  // Joined fields
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
  recentActivities: ActivityLog[];
  upcomingDeadlines: Task[];
}
