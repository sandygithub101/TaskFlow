import { taskRepository, TaskQueryParams } from '../repositories/taskRepository';
import { commentRepository, activityRepository } from '../repositories/commentRepository';
import { Task, Comment, ActivityLog, TaskStatus, TaskPriority } from '../models';

export class TaskService {
  async getTasks(params: TaskQueryParams) {
    return await taskRepository.findAll(params);
  }

  async getTaskById(id: number): Promise<{ task: Task; comments: Comment[]; activities: ActivityLog[] } | null> {
    const task = await taskRepository.findById(id);
    if (!task) return null;

    const comments = await commentRepository.findByTaskId(id);
    const activities = await activityRepository.findByTaskId(id);

    return { task, comments, activities };
  }

  async createTask(data: {
    title: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigned_to?: number | null;
    due_date?: string | null;
  }, userId?: number): Promise<Task> {
    const task = await taskRepository.create(data);
    if (!task) {
      throw new Error('Failed to create task record in database');
    }

    try {
      await activityRepository.log({
        task_id: task.id,
        user_id: userId || data.assigned_to || null,
        action: 'TASK_CREATED',
        details: `Created task "${task.title}" with priority ${task.priority} and status ${task.status}`
      });
    } catch (logErr) {
      console.warn('Failed to record task creation activity log:', logErr);
    }

    return task;
  }

  async updateTask(id: number, data: Partial<{
    title: string;
    description?: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    assigned_to?: number | null;
    due_date?: string | null;
  }>, userId?: number): Promise<Task | null> {
    const existing = await taskRepository.findById(id);
    if (!existing) return null;

    const updated = await taskRepository.update(id, data);
    if (!updated) return null;

    // Log significant changes
    const changes: string[] = [];
    if (data.status && data.status !== existing.status) {
      changes.push(`status from ${existing.status} to ${data.status}`);
    }
    if (data.priority && data.priority !== existing.priority) {
      changes.push(`priority from ${existing.priority} to ${data.priority}`);
    }
    if (data.assigned_to !== undefined && data.assigned_to !== existing.assigned_to) {
      changes.push(`assignee changed to ${updated.assignee_name || 'Unassigned'}`);
    }
    if (data.due_date !== undefined && data.due_date !== existing.due_date) {
      changes.push(`due date set to ${data.due_date || 'None'}`);
    }
    if (data.title && data.title !== existing.title) {
      changes.push(`title updated to "${data.title}"`);
    }

    if (changes.length > 0) {
      await activityRepository.log({
        task_id: id,
        user_id: userId || updated.assigned_to || null,
        action: 'TASK_UPDATED',
        details: `Updated ${changes.join(', ')}`
      });
    }

    return updated;
  }

  async deleteTask(id: number, userId?: number): Promise<boolean> {
    const existing = await taskRepository.findById(id);
    if (!existing) return false;

    const success = await taskRepository.delete(id);
    if (success) {
      await activityRepository.log({
        user_id: userId || null,
        action: 'TASK_DELETED',
        details: `Deleted task "${existing.title}" (ID: ${id})`
      });
    }
    return success;
  }

  async addComment(taskId: number, userId: number, commentText: string): Promise<Comment> {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new Error(`Task with id ${taskId} not found`);
    }

    const comment = await commentRepository.create({
      task_id: taskId,
      user_id: userId,
      comment: commentText
    });

    await activityRepository.log({
      task_id: taskId,
      user_id: userId,
      action: 'COMMENT_ADDED',
      details: `Added a comment on task "${task.title}"`
    });

    return comment;
  }
}

export const taskService = new TaskService();
