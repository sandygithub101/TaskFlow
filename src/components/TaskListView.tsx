import React, { useState } from 'react';
import { Task, User, TaskFilterParams, TaskStatus, TaskPriority } from '../types';
import { Table, Column } from './ui/Table';
import { Pagination } from './ui/Pagination';
import { StatusBadge, PriorityBadge } from './ui/StatusBadge';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { formatDate, formatDateTime, getDaysRemaining } from '../utils/date';
import {
  Search,
  Plus,
  Filter,
  RefreshCw,
  Trash2,
  Edit3,
  Eye,
  MessageSquare,
  AlertCircle,
  X,
  Calendar,
  SlidersHorizontal,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../utils/cn';

export interface TaskListViewProps {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading: boolean;
  filters: TaskFilterParams;
  onFilterChange: (newFilters: Partial<TaskFilterParams>) => void;
  onResetFilters: () => void;
  users: User[];
  onOpenNewTask: () => void;
  onSelectTask: (taskId: number) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => Promise<void>;
  onQuickStatusUpdate: (taskId: number, newStatus: TaskStatus) => Promise<void>;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  total,
  page,
  limit,
  totalPages,
  isLoading,
  filters,
  onFilterChange,
  onResetFilters,
  users,
  onOpenNewTask,
  onSelectTask,
  onEditTask,
  onDeleteTask,
  onQuickStatusUpdate,
}) => {
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const hasActiveFilters =
    Boolean(filters.status) ||
    Boolean(filters.priority) ||
    Boolean(filters.assignee) ||
    Boolean(filters.search) ||
    Boolean(filters.overdue);

  const handleSort = (columnKey: string) => {
    const isCurrent = filters.sort_by === columnKey;
    const newOrder = isCurrent && filters.sort_order === 'asc' ? 'desc' : 'asc';
    onFilterChange({
      sort_by: columnKey as any,
      sort_order: newOrder,
      page: 1,
    });
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteTask(taskToDelete.id);
      setTaskToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Task>[] = [
    {
      key: 'title',
      header: 'Task Name & Details',
      sortable: true,
      className: 'max-w-md',
      render: (task) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-slate-400">#{task.id}</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                onSelectTask(task.id);
              }}
              className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors"
            >
              {task.title}
            </span>
          </div>
          {task.description && (
            <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (task) => (
        <div onClick={(e) => e.stopPropagation()}>
          <select
            value={task.status}
            onChange={(e) => onQuickStatusUpdate(task.id, e.target.value as TaskStatus)}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-semibold border cursor-pointer focus:outline-none transition-colors appearance-none text-center',
              task.status === 'Pending' && 'bg-amber-50 text-amber-800 border-amber-200',
              task.status === 'In Progress' && 'bg-sky-50 text-sky-800 border-sky-200',
              task.status === 'Completed' && 'bg-emerald-50 text-emerald-800 border-emerald-200',
              task.status === 'Blocked' && 'bg-rose-50 text-rose-800 border-rose-200'
            )}
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (task) => <PriorityBadge priority={task.priority} size="sm" />,
    },
    {
      key: 'assignee_name',
      header: 'Assigned User',
      render: (task) => (
        <div className="flex items-center gap-2">
          {task.assignee_avatar ? (
            <img
              src={task.assignee_avatar}
              alt={task.assignee_name || 'Assignee'}
              className="h-6 w-6 rounded-full object-cover border border-slate-200"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
              {task.assignee_name ? task.assignee_name.charAt(0) : '?'}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-slate-800">
              {task.assignee_name || 'Unassigned'}
            </p>
            {task.assignee_role && (
              <p className="text-[10px] text-slate-400">{task.assignee_role}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      sortable: true,
      render: (task) => {
        const info = getDaysRemaining(task.due_date);
        return (
          <div>
            <span
              className={cn(
                'text-xs font-semibold block',
                info.isOverdue && task.status !== 'Completed'
                  ? 'text-rose-600'
                  : 'text-slate-800'
              )}
            >
              {formatDate(task.due_date)}
            </span>
            {task.due_date && (
              <span
                className={cn(
                  'text-[10px] font-medium block',
                  info.isOverdue && task.status !== 'Completed'
                    ? 'text-rose-500 font-bold'
                    : 'text-slate-400'
                )}
              >
                {info.text}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (task) => (
        <span className="text-xs text-slate-500">{formatDate(task.created_at)}</span>
      ),
    },
    {
      key: 'updated_at',
      header: 'Last Updated',
      sortable: true,
      render: (task) => (
        <span className="text-xs text-slate-500">{formatDate(task.updated_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (task) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onSelectTask(task.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEditTask(task)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Edit Task"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTaskToDelete(task)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Task Management</h2>
          <p className="text-xs text-slate-500">
            Search, filter, assign, and organize team backlog items.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={onOpenNewTask}
          >
            Create Task
          </Button>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          {/* Search Box */}
          <div className="lg:col-span-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks by title, keyword, Shopify..."
                value={filters.search || ''}
                onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
                className="w-full h-8.5 rounded-lg border border-slate-200 bg-slate-50/70 pl-8.5 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {filters.search && (
                <button
                  onClick={() => onFilterChange({ search: '', page: 1 })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={filters.status || ''}
              onChange={(e) => onFilterChange({ status: e.target.value, page: 1 })}
              className="w-full h-8.5 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="lg:col-span-2">
            <select
              value={filters.priority || ''}
              onChange={(e) => onFilterChange({ priority: e.target.value, page: 1 })}
              className="w-full h-8.5 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">🔥 Urgent</option>
            </select>
          </div>

          {/* Assignee Filter */}
          <div className="lg:col-span-2">
            <select
              value={filters.assignee || ''}
              onChange={(e) => onFilterChange({ assignee: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
              className="w-full h-8.5 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Assignees</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Overdue toggle & Clear */}
          <div className="lg:col-span-2 flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={Boolean(filters.overdue)}
                onChange={(e) => onFilterChange({ overdue: e.target.checked, page: 1 })}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
              />
              <span className="text-rose-600 font-semibold">Overdue Only</span>
            </label>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetFilters}
                className="text-slate-500 hover:text-slate-800 text-xs px-2 h-7"
                title="Reset all filters"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Data Table with Sorting and Pagination */}
      <Table
        columns={columns}
        data={tasks}
        keyExtractor={(t) => t.id}
        isLoading={isLoading}
        emptyMessage={
          hasActiveFilters
            ? 'No tasks matched your filter criteria. Try clearing search or filters.'
            : 'No tasks found in database. Click "Create Task" to get started!'
        }
        sortBy={filters.sort_by}
        sortOrder={filters.sort_order}
        onSort={handleSort}
        onRowClick={(task) => onSelectTask(task.id)}
      />

      {/* Pagination Footer */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalRecords={total}
        limit={limit}
        onPageChange={(newPage) => onFilterChange({ page: newPage })}
        onLimitChange={(newLimit) => onFilterChange({ limit: newLimit, page: 1 })}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message={`Are you sure you want to permanently delete "${taskToDelete?.title}"? This action will remove all related comments and logs.`}
        confirmText="Delete Task"
        isLoading={isDeleting}
      />
    </div>
  );
};
