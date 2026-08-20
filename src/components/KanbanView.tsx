import React from 'react';
import { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import { Plus, CheckCircle2, Clock, PlayCircle, AlertOctagon } from 'lucide-react';
import { cn } from '../utils/cn';

export interface KanbanViewProps {
  tasks: Task[];
  onSelectTask: (taskId: number) => void;
  onOpenNewTask: () => void;
  onStatusChange: (taskId: number, newStatus: TaskStatus) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  tasks,
  onSelectTask,
  onOpenNewTask,
  onStatusChange,
}) => {
  const columns: { id: TaskStatus; title: string; color: string; icon: React.ReactNode }[] = [
    {
      id: 'Pending',
      title: 'Pending Backlog',
      color: 'border-amber-400 bg-amber-50/30 text-amber-900',
      icon: <Clock className="w-4 h-4 text-amber-600" />,
    },
    {
      id: 'In Progress',
      title: 'In Progress',
      color: 'border-sky-400 bg-sky-50/30 text-sky-900',
      icon: <PlayCircle className="w-4 h-4 text-sky-600" />,
    },
    {
      id: 'Blocked',
      title: 'Blocked / Needs Review',
      color: 'border-rose-400 bg-rose-50/30 text-rose-900',
      icon: <AlertOctagon className="w-4 h-4 text-rose-600" />,
    },
    {
      id: 'Completed',
      title: 'Completed / Shipped',
      color: 'border-emerald-400 bg-emerald-50/30 text-emerald-900',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Kanban Board</h2>
          <p className="text-xs text-slate-500">
            Interactive visual workflow columns. Click on any card to view and manage.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className="rounded-xl border border-slate-200/80 bg-slate-100/70 p-3.5 flex flex-col gap-3 min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-1 pb-1">
                <div className="flex items-center gap-2">
                  {col.icon}
                  <span className="text-xs font-bold text-slate-800">{col.title}</span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 shadow-2xs">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List in Column */}
              <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white/50 p-6 text-center text-xs text-slate-400">
                    No tasks in {col.title.toLowerCase()}
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => onSelectTask(task.id)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
