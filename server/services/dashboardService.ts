import { getDatabase } from '../database/sqlite';
import { userRepository } from '../repositories/userRepository';
import { activityRepository } from '../repositories/commentRepository';
import { DashboardMetrics, Task } from '../models';

export class DashboardService {
  async getDashboardMetrics(currentUserId?: number): Promise<DashboardMetrics> {
    const db = await getDatabase();
    const today = new Date().toISOString().split('T')[0];

    // Status counts
    const statusResults = db.exec(`
      SELECT status, COUNT(*) as count 
      FROM tasks 
      GROUP BY status
    `);

    const statusCounts: Record<string, number> = {
      'Pending': 0,
      'In Progress': 0,
      'Completed': 0,
      'Blocked': 0
    };

    let totalTasks = 0;
    if (statusResults.length > 0) {
      statusResults[0].values.forEach(([status, count]) => {
        statusCounts[status as string] = count as number;
        totalTasks += count as number;
      });
    }

    // Overdue tasks
    const overdueResult = db.exec(`
      SELECT COUNT(*) as count 
      FROM tasks 
      WHERE due_date IS NOT NULL AND due_date < '${today}' AND status != 'Completed'
    `);
    const overdueTasks = (overdueResult[0]?.values[0]?.[0] as number) || 0;

    // Current user resolution
    let currentUser = null;
    let assignedToUserTasks = 0;

    if (currentUserId) {
      currentUser = await userRepository.findById(currentUserId);
      if (currentUser) {
        const myTasksResult = db.exec(`
          SELECT COUNT(*) as count 
          FROM tasks 
          WHERE assigned_to = ${currentUserId} AND status != 'Completed'
        `);
        assignedToUserTasks = (myTasksResult[0]?.values[0]?.[0] as number) || 0;
      }
    } else {
      // Default to first user if none provided
      const users = await userRepository.findAll();
      if (users.length > 0) {
        currentUser = users[0];
        const myTasksResult = db.exec(`
          SELECT COUNT(*) as count 
          FROM tasks 
          WHERE assigned_to = ${currentUser.id} AND status != 'Completed'
        `);
        assignedToUserTasks = (myTasksResult[0]?.values[0]?.[0] as number) || 0;
      }
    }

    // Priority breakdown
    const priorityResult = db.exec(`
      SELECT priority, COUNT(*) as count 
      FROM tasks 
      GROUP BY priority
    `);

    const priorityDistribution = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    };

    if (priorityResult.length > 0) {
      priorityResult[0].values.forEach(([priority, count]) => {
        const p = (priority as string).toLowerCase();
        if (p in priorityDistribution) {
          (priorityDistribution as any)[p] = count as number;
        }
      });
    }

    // Upcoming deadlines (next 7-14 days or overdue, uncompleted)
    const upcomingStmt = db.prepare(`
      SELECT 
        t.id, t.title, t.description, t.status, t.priority, t.assigned_to, t.due_date, t.created_at, t.updated_at,
        u.name as assignee_name, u.avatar as assignee_avatar, u.role as assignee_role
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.status != 'Completed' AND t.due_date IS NOT NULL
      ORDER BY t.due_date ASC
      LIMIT 6
    `);

    const upcomingDeadlines: Task[] = [];
    while (upcomingStmt.step()) {
      upcomingDeadlines.push(upcomingStmt.getAsObject() as unknown as Task);
    }
    upcomingStmt.free();

    // Recent activity log
    const recentActivities = await activityRepository.findRecent(8);

    return {
      totalTasks,
      pendingTasks: statusCounts['Pending'] || 0,
      inProgressTasks: statusCounts['In Progress'] || 0,
      completedTasks: statusCounts['Completed'] || 0,
      blockedTasks: statusCounts['Blocked'] || 0,
      overdueTasks,
      assignedToUserTasks,
      currentUser,
      priorityDistribution,
      recentActivities,
      upcomingDeadlines
    };
  }
}

export const dashboardService = new DashboardService();
