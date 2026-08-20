import React from 'react';
import { DashboardMetrics, Task, User } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { StatusBadge, PriorityBadge } from './ui/StatusBadge';
import { formatDate, getDaysRemaining, formatRelativeTime } from '../utils/date';
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertTriangle,
  ListTodo,
  UserCheck,
  ArrowRight,
  TrendingUp,
  Flame,
  Calendar,
  Sparkles,
  Plus
} from 'lucide-react';
import { cn } from '../utils/cn';

export interface DashboardViewProps {
  metrics: DashboardMetrics | null;
  isLoading: boolean;
  onNavigateToTasks: (filters?: { status?: string; overdue?: boolean; assignee?: number }) => void;
  onOpenNewTask: () => void;
  onSelectTask: (taskId: number) => void;
  currentUser: User | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  isLoading,
  onNavigateToTasks,
  onOpenNewTask,
  onSelectTask,
  currentUser,
}) => {
  if (isLoading || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
        <p className="text-sm font-medium text-slate-500">Aggregating workspace analytics...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Tasks',
      count: metrics.totalTasks,
      icon: <ListTodo className="h-5 w-5 text-indigo-600" />,
      bg: 'bg-indigo-50/50',
      border: 'border-indigo-100',
      description: 'All tracked workspace items',
      onClick: () => onNavigateToTasks(),
    },
    {
      title: 'Pending',
      count: metrics.pendingTasks,
      icon: <Clock className="h-5 w-5 text-amber-600" />,
      bg: 'bg-amber-50/50',
      border: 'border-amber-100',
      description: 'Awaiting sprint kick-off',
      onClick: () => onNavigateToTasks({ status: 'Pending' }),
    },
    {
      title: 'In Progress',
      count: metrics.inProgressTasks,
      icon: <PlayCircle className="h-5 w-5 text-sky-600" />,
      bg: 'bg-sky-50/50',
      border: 'border-sky-100',
      description: 'Active engineering work',
      onClick: () => onNavigateToTasks({ status: 'In Progress' }),
    },
    {
      title: 'Completed',
      count: metrics.completedTasks,
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-100',
      description: 'Successfully shipped',
      onClick: () => onNavigateToTasks({ status: 'Completed' }),
    },
    {
      title: 'Overdue Tasks',
      count: metrics.overdueTasks,
      icon: <AlertTriangle className="h-5 w-5 text-rose-600" />,
      bg: 'bg-rose-50/50',
      border: 'border-rose-100',
      highlight: metrics.overdueTasks > 0,
      description: 'Missed target due dates',
      onClick: () => onNavigateToTasks({ overdue: true }),
    },
    {
      title: 'Assigned to Me',
      count: metrics.assignedToUserTasks,
      icon: <UserCheck className="h-5 w-5 text-violet-600" />,
      bg: 'bg-violet-50/50',
      border: 'border-violet-100',
      description: `Assigned to ${currentUser?.name?.split(' ')[0] || 'You'}`,
      onClick: () => currentUser && onNavigateToTasks({ assignee: currentUser.id }),
    },
  ];

  const totalPriorityCount =
    metrics.priorityDistribution.low +
    metrics.priorityDistribution.medium +
    metrics.priorityDistribution.high +
    metrics.priorityDistribution.urgent || 1;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              Workspace Health
            </span>
            <span className="text-xs text-slate-400">
              {metrics.completedTasks} / {metrics.totalTasks} Done (
              {Math.round((metrics.completedTasks / (metrics.totalTasks || 1)) * 100)}%)
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Welcome back, {currentUser?.name || 'Architect'}
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            You have <span className="font-semibold text-amber-400">{metrics.assignedToUserTasks} active tasks</span> assigned to your queue, with{' '}
            <span className="font-semibold text-rose-400">{metrics.overdueTasks} overdue</span> items across the team.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={onOpenNewTask}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs border-0 font-semibold text-xs"
          >
            Create Task
          </Button>
        </div>
      </div>

      {/* 6 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            onClick={card.onClick}
            className={cn(
              'group relative rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all duration-150 cursor-pointer flex flex-col justify-between',
              card.highlight && 'ring-2 ring-rose-500/20 border-rose-200'
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">{card.title}</span>
              <div className={cn('p-1.5 rounded-lg shrink-0', card.bg)}>{card.icon}</div>
            </div>

            <div>
              <div className="text-2xl font-bold tracking-tight text-slate-900">
                {card.count}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                {card.description} →
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Priority Distribution & Upcoming Deadlines Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Breakdown Card */}
        <Card className="lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-slate-900">Priority Distribution</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Total: {totalPriorityCount}</span>
            </div>

            <div className="mt-4 space-y-3.5">
              {/* Urgent */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-red-700 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> Urgent
                  </span>
                  <span className="text-slate-600 font-bold">
                    {metrics.priorityDistribution.urgent} ({Math.round((metrics.priorityDistribution.urgent / totalPriorityCount) * 100)}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${(metrics.priorityDistribution.urgent / totalPriorityCount) * 100}%` }}
                  />
                </div>
              </div>

              {/* High */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-orange-700 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500" /> High
                  </span>
                  <span className="text-slate-600 font-bold">
                    {metrics.priorityDistribution.high} ({Math.round((metrics.priorityDistribution.high / totalPriorityCount) * 100)}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${(metrics.priorityDistribution.high / totalPriorityCount) * 100}%` }}
                  />
                </div>
              </div>

              {/* Medium */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-blue-700 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Medium
                  </span>
                  <span className="text-slate-600 font-bold">
                    {metrics.priorityDistribution.medium} ({Math.round((metrics.priorityDistribution.medium / totalPriorityCount) * 100)}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${(metrics.priorityDistribution.medium / totalPriorityCount) * 100}%` }}
                  />
                </div>
              </div>

              {/* Low */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" /> Low
                  </span>
                  <span className="text-slate-600 font-bold">
                    {metrics.priorityDistribution.low} ({Math.round((metrics.priorityDistribution.low / totalPriorityCount) * 100)}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 rounded-full transition-all duration-500"
                    style={{ width: `${(metrics.priorityDistribution.low / totalPriorityCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigateToTasks()}
              className="w-full py-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1 transition-colors"
            >
              Filter in Task Table <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>

        {/* Upcoming & Overdue Deadlines Card */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Upcoming & Urgent Deadlines</h3>
            </div>
            <button
              onClick={() => onNavigateToTasks()}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View All Tasks →
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {(!metrics.upcomingDeadlines || metrics.upcomingDeadlines.length === 0) ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No upcoming deadlines on record.
              </div>
            ) : (
              metrics.upcomingDeadlines.map((t) => {
                const info = getDaysRemaining(t.due_date);
                return (
                  <div
                    key={t.id}
                    onClick={() => onSelectTask(t.id)}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <PriorityBadge priority={t.priority} size="sm" />
                        <span className="text-xs font-bold text-slate-900 truncate hover:text-indigo-600">
                          {t.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span>Assignee: {t.assignee_name || 'Unassigned'}</span>
                        <span>•</span>
                        <span>Status: {t.status}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                          info.isOverdue
                            ? 'bg-rose-100 text-rose-800'
                            : info.isToday
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        )}
                      >
                        {info.text}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        {formatDate(t.due_date)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activity Audit Feed */}
      {metrics.recentActivities && metrics.recentActivities.length > 0 && (
        <Card>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Workspace Activity Feed</h3>
            <span className="text-xs text-slate-400 font-mono">Live Audit Trail</span>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {metrics.recentActivities.map((act) => (
              <div
                key={act.id}
                onClick={() => act.task_id && onSelectTask(act.task_id)}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {act.user_name || 'System'}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatRelativeTime(act.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{act.details}</p>
                  {act.task_title && (
                    <p className="text-[11px] font-medium text-indigo-600 mt-0.5 truncate">
                      ↳ {act.task_title}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
