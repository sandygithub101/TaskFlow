import {
  Task,
  User,
  Comment,
  TaskDetailResponse,
  PaginatedResponse,
  TaskFilterParams,
  DashboardMetrics,
  ExternalApiResponse,
  TaskStatus,
  TaskPriority
} from '../types';

const API_BASE = '/api';

class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const currentUserId = localStorage.getItem('taskflow_current_user_id') || '1';

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-user-id': currentUserId,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetails;
    try {
      errorDetails = await response.json();
    } catch {
      errorDetails = { error: response.statusText };
    }
    const message = errorDetails.error || errorDetails.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, errorDetails.details);
  }

  return response.json();
}

export const api = {
  // Tasks API
  async getTasks(params: TaskFilterParams = {}): Promise<PaginatedResponse<Task>> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.priority) query.set('priority', params.priority);
    if (params.assignee) query.set('assignee', String(params.assignee));
    if (params.search) query.set('search', params.search);
    if (params.overdue) query.set('overdue', 'true');
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.sort_order) query.set('sort_order', params.sort_order);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return request<PaginatedResponse<Task>>(`/tasks${qs ? `?${qs}` : ''}`);
  },

  async getTask(id: number): Promise<TaskDetailResponse> {
    return request<TaskDetailResponse>(`/tasks/${id}`);
  },

  async createTask(data: {
    title: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigned_to?: number | null;
    due_date?: string | null;
  }): Promise<Task> {
    return request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTask(id: number, data: Partial<{
    title: string;
    description?: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    assigned_to?: number | null;
    due_date?: string | null;
  }>): Promise<Task> {
    return request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteTask(id: number): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  async addComment(taskId: number, userId: number, comment: string): Promise<Comment> {
    return request<Comment>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, comment }),
    });
  },

  // Users API
  async getUsers(): Promise<User[]> {
    return request<User[]>('/users');
  },

  async createUser(data: { name: string; email: string; role?: string; avatar?: string | null }): Promise<User> {
    return request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Dashboard API
  async getDashboard(userId?: number): Promise<DashboardMetrics> {
    const qs = userId ? `?user_id=${userId}` : '';
    return request<DashboardMetrics>(`/dashboard${qs}`);
  },

  // External Integration API
  async getExternalUsers(refresh = false): Promise<ExternalApiResponse> {
    const qs = refresh ? '?refresh=true' : '';
    return request<ExternalApiResponse>(`/external/users${qs}`);
  },

  async importExternalUser(user: { name: string; email: string; role?: string; avatar?: string }): Promise<User> {
    const res = await request<{ success: boolean; user: User }>('/external/import', {
      method: 'POST',
      body: JSON.stringify(user),
    });
    return res.user;
  }
};
