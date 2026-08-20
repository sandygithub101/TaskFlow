import React from 'react';
import { User } from '../types';
import { Button } from './ui/Button';
import { 
  CheckSquare, 
  Plus, 
  Users, 
  Globe2, 
  Search, 
  Layers, 
  Bell, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

export interface NavbarProps {
  currentUser: User | null;
  users: User[];
  onOpenNewTask: () => void;
  onOpenTeamManager: () => void;
  onUserSelect: (user: User) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  users,
  onOpenNewTask,
  onOpenTeamManager,
  onUserSelect,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white px-4 sm:px-6 shadow-xs select-none">
      {/* Brand & Main Tabs */}
      <div className="flex items-center gap-6">
        <div 
          onClick={() => onTabChange('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
            <CheckSquare className="h-4.5 w-4.5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-slate-900">TaskFlow</span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium -mt-0.5 hidden sm:block">Enterprise Workspace</p>
          </div>
        </div>

        {/* Quick Nav Links on larger screens */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onTabChange('tasks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'tasks'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Task List
          </button>
          <button
            onClick={() => onTabChange('kanban')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'kanban'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Board
          </button>
          <button
            onClick={() => onTabChange('external')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'external'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-sky-500" />
            <span>External API</span>
          </button>
        </nav>
      </div>

      {/* Center Search Input */}
      <div className="hidden lg:flex items-center max-w-sm w-full mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks, descriptions..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-8.5 rounded-lg border border-slate-200 bg-slate-50/80 pl-8.5 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Right User & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Create Task Button */}
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={onOpenNewTask}
          className="bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-xs"
        >
          <span className="hidden sm:inline">New Task</span>
          <span className="sm:hidden">New</span>
        </Button>

        {/* Team Manager Button */}
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Users className="w-3.5 h-3.5 text-slate-500" />}
          onClick={onOpenTeamManager}
          className="hidden sm:inline-flex border-slate-200 hover:bg-slate-50 text-slate-700"
        >
          Team ({users.length})
        </Button>

        {/* User Persona Switcher */}
        <div className="relative group">
          <button
            onClick={onOpenTeamManager}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Switch user persona"
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-7 w-7 rounded-full object-cover border border-slate-200"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="text-left hidden xl:block">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">
                {currentUser?.name || 'Current User'}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight truncate max-w-[100px]">
                {currentUser?.role || 'Member'}
              </p>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
