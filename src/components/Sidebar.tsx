import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Kanban, 
  Users, 
  Globe2, 
  Server,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../utils/cn';

export interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  taskCounts: {
    total: number;
    pending: number;
    inProgress: number;
    overdue: number;
    myTasks: number;
  };
  onFilterShortcut?: (filterKey: string, value: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  taskCounts,
  onFilterShortcut,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Executive Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'tasks', label: 'Task Management', icon: <CheckSquare className="w-4 h-4" />, count: taskCounts.total },
    { id: 'kanban', label: 'Kanban Board', icon: <Kanban className="w-4 h-4" /> },
    { id: 'external', label: 'External API Sync', icon: <Globe2 className="w-4 h-4" />, badge: 'REST' },
    { id: 'team', label: 'Team Directory', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col justify-between border-r border-slate-800 bg-slate-900 p-4 min-h-[calc(100vh-4rem)] select-none">
      <div className="space-y-6">
        {/* Navigation Sections */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">
            Workspaces
          </p>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className={cn(isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200')}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-bold',
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                    )}
                  >
                    {item.count}
                  </span>
                )}
                {item.badge && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider',
                      isActive ? 'bg-white/20 text-white' : 'bg-indigo-950 text-indigo-400 border border-indigo-800/60'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Task Status Shortcuts */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">
            Quick Views
          </p>
          <button
            onClick={() => {
              onTabChange('tasks');
              onFilterShortcut?.('status', 'In Progress');
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>In Progress Tasks</span>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">{taskCounts.inProgress}</span>
          </button>

          <button
            onClick={() => {
              onTabChange('tasks');
              onFilterShortcut?.('overdue', true);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Overdue Deadlines</span>
            </div>
            <span className="text-rose-400 font-mono text-[11px] font-bold">{taskCounts.overdue}</span>
          </button>

          <button
            onClick={() => {
              onTabChange('tasks');
              onFilterShortcut?.('myTasks', true);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>Assigned To Me</span>
            </div>
            <span className="text-indigo-400 font-mono text-[11px] font-bold">{taskCounts.myTasks}</span>
          </button>
        </div>
      </div>

      {/* Footer System Status Widget */}
      <div className="rounded-xl border border-slate-800 bg-slate-800/80 p-3 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold text-slate-200">Live Status: Active</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">v1.0.4</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          SQLite + Express REST API running with live transaction logs.
        </p>
      </div>
    </aside>
  );
};
