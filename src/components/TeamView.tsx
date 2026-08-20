import React, { useState } from 'react';
import { User, Task } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { UserPlus, Mail, Shield, Check, Calendar, ArrowRight } from 'lucide-react';
import { formatDate } from '../utils/date';

export interface TeamViewProps {
  users: User[];
  currentUser: User | null;
  tasks: Task[];
  onOpenTeamManager: () => void;
  onSelectUser: (user: User) => void;
  onFilterTasksByUser: (userId: number) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({
  users,
  currentUser,
  tasks,
  onOpenTeamManager,
  onSelectUser,
  onFilterTasksByUser,
}) => {
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Team Directory</h2>
          <p className="text-xs text-slate-500">
            View engineering members, assign tasks, and inspect workload distribution.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={onOpenTeamManager}
        >
          Add Team Member
        </Button>
      </div>

      <div className="max-w-md">
        <Input
          placeholder="Filter team members by name, role, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const userTasks = tasks.filter((t) => t.assigned_to === user.id);
          const activeTasks = userTasks.filter((t) => t.status !== 'Completed');
          const isCurrent = currentUser?.id === user.id;

          return (
            <Card key={user.id} className="flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-base">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{user.name}</h4>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded mt-0.5">
                        <Shield className="w-3 h-3 text-indigo-500" /> {user.role}
                      </span>
                    </div>
                  </div>

                  {isCurrent && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      Active User
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Member since {formatDate(user.created_at)}</span>
                  </div>
                </div>

                {/* Workload Stats */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-around text-center">
                  <div>
                    <span className="block text-base font-bold text-slate-900">{userTasks.length}</span>
                    <span className="text-[10px] text-slate-500 font-medium">Assigned</span>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div>
                    <span className="block text-base font-bold text-indigo-600">{activeTasks.length}</span>
                    <span className="text-[10px] text-slate-500 font-medium">Active</span>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div>
                    <span className="block text-base font-bold text-emerald-600">
                      {userTasks.length - activeTasks.length}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Done</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFilterTasksByUser(user.id)}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  View Tasks <ArrowRight className="w-3 h-3 ml-1" />
                </Button>

                {!isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectUser(user)}
                    className="text-xs"
                  >
                    Switch Persona
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
