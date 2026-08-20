import React from 'react';
import { Task } from '../types';
import { StatusBadge, PriorityBadge } from './ui/StatusBadge';
import { formatDate, getDaysRemaining } from '../utils/date';
import { Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

export interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onStatusChange?: (status: Task['status']) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const deadlineInfo = getDaysRemaining(task.due_date);

  return (
    <div
      onClick={onClick}
      className="group relative rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition-all duration-150 cursor-pointer flex flex-col justify-between gap-3 select-none"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <PriorityBadge priority={task.priority} size="sm" />
          <StatusBadge status={task.status} size="sm" />
        </div>

        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {task.title}
        </h4>

        {task.description && (
          <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        {/* Assignee */}
        <div className="flex items-center gap-1.5 min-w-0">
          {task.assignee_avatar ? (
            <img
              src={task.assignee_avatar}
              alt={task.assignee_name || 'Assignee'}
              className="h-5 w-5 rounded-full object-cover border border-slate-200 shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-5 w-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600 shrink-0">
              {task.assignee_name ? task.assignee_name.charAt(0) : '?'}
            </div>
          )}
          <span className="text-slate-600 font-medium truncate text-[11px]">
            {task.assignee_name || 'Unassigned'}
          </span>
        </div>

        {/* Right stats (Due date + Comments) */}
        <div className="flex items-center gap-2 shrink-0">
          {task.due_date && (
            <div
              className={cn(
                'flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium',
                deadlineInfo.isOverdue && task.status !== 'Completed'
                  ? 'bg-rose-50 text-rose-700 font-semibold'
                  : deadlineInfo.isToday
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-slate-500'
              )}
              title={`Due: ${formatDate(task.due_date)}`}
            >
              {deadlineInfo.isOverdue && task.status !== 'Completed' ? (
                <AlertCircle className="w-3 h-3 text-rose-600" />
              ) : (
                <Calendar className="w-3 h-3" />
              )}
              <span>{deadlineInfo.isOverdue && task.status !== 'Completed' ? deadlineInfo.text : formatDate(task.due_date)}</span>
            </div>
          )}

          {(task.comment_count !== undefined && task.comment_count > 0) && (
            <div className="flex items-center gap-1 text-slate-400 text-[10px]">
              <MessageSquare className="w-3 h-3" />
              <span>{task.comment_count}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
