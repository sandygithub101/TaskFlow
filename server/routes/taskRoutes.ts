import { Router, Request, Response } from 'express';
import { taskService } from '../services/taskService';
import { CreateTaskSchema, UpdateTaskSchema, CreateCommentSchema, TaskQuerySchema } from '../schemas';

const router = Router();

// GET /api/tasks (with filtering, pagination, search, sorting)
router.get('/', async (req: Request, res: Response) => {
  try {
    const queryValidation = TaskQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: queryValidation.error.issues
      });
    }

    const { status, priority, assignee, search, overdue, sort_by, sort_order, page, limit } = queryValidation.data;

    const result = await taskService.getTasks({
      status,
      priority,
      assignee: assignee ? parseInt(assignee, 10) : undefined,
      search,
      overdue: overdue === 'true' || overdue === '1',
      sortBy: sort_by,
      sortOrder: sort_order,
      page,
      limit
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Task ID must be a valid integer' });
    }

    const result = await taskService.getTaskById(id);
    if (!result) {
      return res.status(404).json({ error: `Task with ID ${id} not found` });
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching task details:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/tasks
router.post('/', async (req: Request, res: Response) => {
  try {
    const validation = CreateTaskSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues
      });
    }

    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : undefined;
    const task = await taskService.createTask(validation.data, currentUserId);
    res.status(201).json(task);
  } catch (error: any) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: error.message || 'Failed to create task' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Task ID must be a valid integer' });
    }

    const validation = UpdateTaskSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues
      });
    }

    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : undefined;
    const updated = await taskService.updateTask(id, validation.data, currentUserId);
    if (!updated) {
      return res.status(404).json({ error: `Task with ID ${id} not found` });
    }

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: error.message || 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Task ID must be a valid integer' });
    }

    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : undefined;
    const success = await taskService.deleteTask(id, currentUserId);
    if (!success) {
      return res.status(404).json({ error: `Task with ID ${id} not found` });
    }

    res.status(200).json({ success: true, message: `Task ${id} deleted successfully` });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: error.message || 'Failed to delete task' });
  }
});

// POST /api/tasks/:id/comments
router.post('/:id/comments', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Task ID must be a valid integer' });
    }

    const validation = CreateCommentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues
      });
    }

    const comment = await taskService.addComment(taskId, validation.data.user_id, validation.data.comment);
    res.status(201).json(comment);
  } catch (error: any) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: error.message || 'Failed to add comment' });
  }
});

export default router;
