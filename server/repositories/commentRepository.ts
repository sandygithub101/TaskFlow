import { getDatabase, saveDatabase } from '../database/sqlite';
import { Comment, ActivityLog } from '../models';

export class CommentRepository {
  async findByTaskId(taskId: number): Promise<Comment[]> {
    const db = await getDatabase();
    const sql = `
      SELECT 
        c.id, 
        c.task_id, 
        c.user_id, 
        c.comment, 
        c.created_at,
        u.name as user_name,
        u.avatar as user_avatar,
        u.role as user_role
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.task_id = ?
      ORDER BY c.created_at ASC
    `;
    const stmt = db.prepare(sql);
    stmt.bind([taskId]);

    const comments: Comment[] = [];
    while (stmt.step()) {
      comments.push(stmt.getAsObject() as unknown as Comment);
    }
    stmt.free();
    return comments;
  }

  async create(data: { task_id: number; user_id: number; comment: string }): Promise<Comment> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    db.run(
      'INSERT INTO comments (task_id, user_id, comment, created_at) VALUES (?, ?, ?, ?)',
      [data.task_id, data.user_id, data.comment, now]
    );
    saveDatabase(db);

    const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
    let newId = 0;
    if (lastIdResult.length > 0 && lastIdResult[0].values.length > 0) {
      newId = Number(lastIdResult[0].values[0][0]);
    }
    if (!newId) {
      const maxIdResult = db.exec('SELECT MAX(id) as id FROM comments');
      newId = Number(maxIdResult[0]?.values[0]?.[0] || 0);
    }

    const list = await this.findByTaskId(data.task_id);
    const found = list.find(c => c.id === newId);
    if (!found) {
      return {
        id: newId,
        task_id: data.task_id,
        user_id: data.user_id,
        comment: data.comment,
        created_at: now
      };
    }
    return found;
  }

  async delete(commentId: number): Promise<boolean> {
    const db = await getDatabase();
    db.run('DELETE FROM comments WHERE id = ?', [commentId]);
    saveDatabase(db);
    return true;
  }
}

export class ActivityRepository {
  async log(data: { task_id?: number | null; user_id?: number | null; action: string; details?: string | null }): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    db.run(
      'INSERT INTO activity_logs (task_id, user_id, action, details, created_at) VALUES (?, ?, ?, ?, ?)',
      [data.task_id || null, data.user_id || null, data.action, data.details || null, now]
    );
    saveDatabase(db);
  }

  async findRecent(limit = 10): Promise<ActivityLog[]> {
    const db = await getDatabase();
    const sql = `
      SELECT 
        a.id, 
        a.task_id, 
        a.user_id, 
        a.action, 
        a.details, 
        a.created_at,
        u.name as user_name,
        t.title as task_title
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN tasks t ON a.task_id = t.id
      ORDER BY a.created_at DESC
      LIMIT ?
    `;
    const stmt = db.prepare(sql);
    stmt.bind([limit]);

    const logs: ActivityLog[] = [];
    while (stmt.step()) {
      logs.push(stmt.getAsObject() as unknown as ActivityLog);
    }
    stmt.free();
    return logs;
  }

  async findByTaskId(taskId: number): Promise<ActivityLog[]> {
    const db = await getDatabase();
    const sql = `
      SELECT 
        a.id, 
        a.task_id, 
        a.user_id, 
        a.action, 
        a.details, 
        a.created_at,
        u.name as user_name,
        t.title as task_title
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN tasks t ON a.task_id = t.id
      WHERE a.task_id = ?
      ORDER BY a.created_at DESC
    `;
    const stmt = db.prepare(sql);
    stmt.bind([taskId]);

    const logs: ActivityLog[] = [];
    while (stmt.step()) {
      logs.push(stmt.getAsObject() as unknown as ActivityLog);
    }
    stmt.free();
    return logs;
  }
}

export const commentRepository = new CommentRepository();
export const activityRepository = new ActivityRepository();
