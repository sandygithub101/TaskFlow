import React from 'react';
import { TaskStatus, TaskPriority } from '../../types';
import { cn } from '../../utils/cn';
import { 
  Clock, 
  PlayCircle, 
  CheckCircle2, 
  AlertOctagon, 
  ArrowDown, 
  Minus, 
  ArrowUp, 
  Flame 
} from 'lucide-react';

export interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, size = 'md' }) => {
  const configs: Record<TaskStatus, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
    'Pending': {
      bg: 'bg-amber-50/80',
      text: 'text-amber-700',
      border: 'border-amber-200/80',
      icon: <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
      label: 'Pending'
    },
    'In Progress': {
      bg: 'bg-sky-50/80',
      text: 'text-sky-700',
      border: 'border-sky-200/80',
      icon: <PlayCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
      label: 'In Progress'
    },
    'Completed': {
      bg: 'bg-emerald-50/80',
      text: 'text-emerald-700',
      border: 'border-emerald-200/80',
      icon: <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
      label: 'Completed'
    },
    'Blocked': {
      bg: 'bg-rose-50/80',
      text: 'text-rose-700',
      border: 'border-rose-200/80',
      icon: <AlertOctagon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
      label: 'Blocked'
    }
  };

  const config = configs[status] || configs['Pending'];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-semibold rounded-full border whitespace-nowrap select-none',
        config.bg,
        config.text,
        config.border,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
        className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};

export interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className, size = 'md' }) => {
  const configs: Record<TaskPriority, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
    'Low': {
      bg: 'bg-slate-100/90',
      text: 'text-slate-600',
      border: 'border-slate-200',
      icon: <ArrowDown className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3 text-slate-500'} />,
      label: 'Low'
    },
    'Medium': {
      bg: 'bg-slate-100/90',
      text: 'text-slate-700',
      border: 'border-slate-200',
      icon: <Minus className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3 text-slate-500'} />,
      label: 'Medium'
    },
    'High': {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: <ArrowUp className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3 text-amber-600'} />,
      label: 'High'
    },
    'Urgent': {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: <Flame className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3 text-rose-600 fill-rose-500/20'} />,
      label: 'Urgent'
    }
  };

  const config = configs[priority] || configs['Medium'];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-bold rounded-md border whitespace-nowrap select-none uppercase tracking-wider',
        config.bg,
        config.text,
        config.border,
        size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]',
        className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
