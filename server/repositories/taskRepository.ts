import { getDatabase, saveDatabase } from '../database/sqlite';
import { Task, TaskStatus, TaskPriority } from '../models';

export interface TaskQueryParams {
  status?: string;
  priority?: string;
  assignee?: number;
  search?: string;
  overdue?: boolean;
  assignedToUser?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class TaskRepository {
  async findAll(params: TaskQueryParams = {}): Promise<{ tasks: Task[]; total: number; page: number; limit: number; totalPages: number }> {
    const db = await getDatabase();
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];

    if (params.status) {
      const statuses = params.status.split(',').map(s => s.trim());
      if (statuses.length === 1) {
        conditions.push('t.status = ?');
        values.push(statuses[0]);
      } else {
        const placeholders = statuses.map(() => '?').join(',');
        conditions.push(`t.status IN (${placeholders})`);
        values.push(...statuses);
      }
    }

    if (params.priority) {
      const priorities = params.priority.split(',').map(p => p.trim());
      if (priorities.length === 1) {
        conditions.push('t.priority = ?');
        values.push(priorities[0]);
      } else {
        const placeholders = priorities.map(() => '?').join(',');
        conditions.push(`t.priority IN (${placeholders})`);
        values.push(...priorities);
      }
    }

    if (params.assignee !== undefined && params.assignee !== null) {
      conditions.push('t.assigned_to = ?');
      values.push(params.assignee);
    }

    if (params.search && params.search.trim()) {
      conditions.push('(t.title LIKE ? OR t.description LIKE ?)');
      const searchWildcard = `%${params.search.trim()}%`;
      values.push(searchWildcard, searchWildcard);
    }

    if (params.overdue) {
      const today = new Date().toISOString().split('T')[0];
      conditions.push('t.due_date IS NOT NULL AND t.due_date < ? AND t.status != "Completed"');
      values.push(today);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total records
    const countSql = `SELECT COUNT(*) as total FROM tasks t ${whereClause}`;
    const countStmt = db.prepare(countSql);
    if (values.length > 0) {
      countStmt.bind(values);
    }
    let total = 0;
    if (countStmt.step()) {
      total = countStmt.getAsObject().total as number;
    }
    countStmt.free();

    // Sorting
    const validSortFields: Record<string, string> = {
      title: 't.title',
      status: 't.status',
      priority: 'CASE t.priority WHEN "Urgent" THEN 1 WHEN "High" THEN 2 WHEN "Medium" THEN 3 WHEN "Low" THEN 4 ELSE 5 END',
      due_date: 'CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END, t.due_date',
      created_at: 't.created_at',
      updated_at: 't.updated_at'
    };

    const sortByColumn = validSortFields[params.sortBy || 'updated_at'] || 't.updated_at';
    const sortOrder = (params.sortOrder || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const selectSql = `
      SELECT 
        t.id, 
        t.title, 
        t.description, 
        t.status, 
        t.priority, 
        t.assigned_to, 
        t.due_date, 
        t.created_at, 
        t.updated_at,
        u.name as assignee_name,
        u.email as assignee_email,
        u.avatar as assignee_avatar,
        u.role as assignee_role,
        (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) as comment_count
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      ${whereClause}
      ORDER BY ${sortByColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const selectStmt = db.prepare(selectSql);
    const selectValues = [...values, limit, offset];
    selectStmt.bind(selectValues);

    const tasks: Task[] = [];
    while (selectStmt.step()) {
      tasks.push(selectStmt.getAsObject() as unknown as Task);
    }
    selectStmt.free();

    return {
      tasks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  async findById(id: number): Promise<Task | null> {
    const db = await getDatabase();
    const sql = `
      SELECT 
        t.id, 
        t.title, 
        t.description, 
        t.status, 
        t.priority, 
        t.assigned_to, 
        t.due_date, 
        t.created_at, 
        t.updated_at,
        u.name as assignee_name,
        u.email as assignee_email,
        u.avatar as assignee_avatar,
        u.role as assignee_role,
        (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) as comment_count
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ?
    `;
    const stmt = db.prepare(sql);
    stmt.bind([id]);

    if (stmt.step()) {
      const task = stmt.getAsObject() as unknown as Task;
      stmt.free();
      return task;
    }
    stmt.free();
    return null;
  }

  async create(data: {
    title: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigned_to?: number | null;
    due_date?: string | null;
  }): Promise<Task> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO tasks (title, description, status, priority, assigned_to, due_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.description || null,
        data.status || 'Pending',
        data.priority || 'Medium',
        data.assigned_to !== undefined && data.assigned_to !== null ? data.assigned_to : null,
        data.due_date || null,
        now,
        now
      ]
    );

    saveDatabase(db);

    const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
    let newId = 0;
    if (lastIdResult.length > 0 && lastIdResult[0].values.length > 0) {
      newId = Number(lastIdResult[0].values[0][0]);
    }
    if (!newId) {
      const maxIdResult = db.exec('SELECT MAX(id) as id FROM tasks');
      newId = Number(maxIdResult[0]?.values[0]?.[0] || 0);
    }

    const createdTask = await this.findById(newId);
    if (!createdTask) {
      throw new Error(`Failed to retrieve newly created task with id ${newId}`);
    }
    return createdTask;
  }

  async update(id: number, data: Partial<{
    title: string;
    description?: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    assigned_to?: number | null;
    due_date?: string | null;
  }>): Promise<Task | null> {
    const db = await getDatabase();
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.priority !== undefined) {
      updates.push('priority = ?');
      values.push(data.priority);
    }
    if (data.assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      values.push(data.assigned_to);
    }
    if (data.due_date !== undefined) {
      updates.push('due_date = ?');
      values.push(data.due_date);
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    db.run(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, values);
    saveDatabase(db);

    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const db = await getDatabase();
    const existing = await this.findById(id);
    if (!existing) return false;

    db.run('DELETE FROM tasks WHERE id = ?', [id]);
    saveDatabase(db);
    return true;
  }
}

export const taskRepository = new TaskRepository();
