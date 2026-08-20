import { z } from 'zod';

export const TaskStatusEnum = z.enum(['Pending', 'In Progress', 'Completed', 'Blocked']);
export const TaskPriorityEnum = z.enum(['Low', 'Medium', 'High', 'Urgent']);

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title too long'),
  description: z.string().optional().nullable(),
  status: TaskStatusEnum.default('Pending'),
  priority: TaskPriorityEnum.default('Medium'),
  assigned_to: z.number().int().positive().optional().nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format').optional().nullable(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title too long').optional(),
  description: z.string().optional().nullable(),
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  assigned_to: z.number().int().positive().optional().nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format').optional().nullable(),
});

export const CreateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  role: z.string().min(2).default('Member'),
  avatar: z.string().url().optional().nullable(),
});

export const CreateCommentSchema = z.object({
  user_id: z.number().int().positive('Valid user_id is required'),
  comment: z.string().min(1, 'Comment text cannot be empty').max(2000, 'Comment too long'),
});

export const TaskQuerySchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  assignee: z.string().optional(),
  search: z.string().optional(),
  overdue: z.string().optional(),
  sort_by: z.enum(['due_date', 'created_at', 'updated_at', 'priority', 'status', 'title']).default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
