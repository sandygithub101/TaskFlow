import React, { useState } from 'react';
import { User } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { useToast } from './ui/Toast';
import { api } from '../services/api';
import { UserPlus, Users, Check, Shield } from 'lucide-react';

export interface TeamManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User | null;
  onUserCreated: (user: User) => void;
  onCurrentUserChange: (user: User) => void;
}

export const TeamManagerModal: React.FC<TeamManagerModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onUserCreated,
  onCurrentUserChange,
}) => {
  const { success, error: showError } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Frontend Engineer');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showError('Name and email are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const newUser = await api.createUser({
        name: name.trim(),
        email: email.trim(),
        role,
        avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 50000)}?w=150&auto=format&fit=crop&q=80`
      });

      success(`Added ${newUser.name} to the team`);
      onUserCreated(newUser);
      setName('');
      setEmail('');
      setIsAdding(false);
    } catch (err: any) {
      showError(err.message || 'Failed to add team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Team Directory & Member Management"
      description="Manage team assignments, roles, and test user switching."
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Active User Switcher Banner */}
        <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-indigo-900">Current Session Persona</p>
              <p className="text-sm font-bold text-indigo-950">{currentUser?.name}</p>
              <p className="text-[11px] text-indigo-700">{currentUser?.role}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-200 text-indigo-900">
            <Check className="w-3 h-3" /> Active
          </span>
        </div>

        {/* Action Toggle */}
        <div className="flex items-center justify-between pt-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Team Members ({users.length})
          </h4>
          <Button
            size="sm"
            variant={isAdding ? 'outline' : 'primary'}
            leftIcon={isAdding ? undefined : <UserPlus className="w-3.5 h-3.5" />}
            onClick={() => setIsAdding(!isAdding)}
          >
            {isAdding ? 'Cancel' : 'Add Team Member'}
          </Button>
        </div>

        {/* Add User Form */}
        {isAdding && (
          <form onSubmit={handleCreate} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <h5 className="text-sm font-bold text-slate-800">Add New Team Member</h5>
            <Input
              label="Full Name"
              placeholder="e.g., Jennifer Wu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g., jennifer.wu@company.internal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={[
                { value: 'Lead Architect', label: 'Lead Architect' },
                { value: 'Senior Backend Engineer', label: 'Senior Backend Engineer' },
                { value: 'Frontend Engineer', label: 'Frontend Engineer' },
                { value: 'Product Designer', label: 'Product Designer' },
                { value: 'DevOps & Cloud Lead', label: 'DevOps & Cloud Lead' },
                { value: 'QA Automation Lead', label: 'QA Automation Lead' },
                { value: 'Product Manager', label: 'Product Manager' },
              ]}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save Member
              </Button>
            </div>
          </form>
        )}

        {/* Users List with Switch Option */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {users.map((u) => {
            const isCurrent = currentUser?.id === u.id;
            return (
              <div
                key={u.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isCurrent ? 'bg-indigo-50/40 border-indigo-300 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                      {u.name.charAt(0)}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-sm font-bold text-slate-900 truncate">{u.name}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">
                      <Shield className="w-2.5 h-2.5 text-slate-400" /> {u.role}
                    </span>
                  </div>
                </div>

                <div>
                  {isCurrent ? (
                    <span className="text-xs font-semibold text-indigo-600 px-2 py-1 bg-indigo-100 rounded-md">
                      Current
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onCurrentUserChange(u);
                        success(`Switched active user to ${u.name}`);
                      }}
                    >
                      Switch To
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
