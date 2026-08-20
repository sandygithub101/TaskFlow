import React, { useState, useEffect } from 'react';
import { Task, User, Comment, ActivityLog, TaskStatus, TaskPriority } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { StatusBadge, PriorityBadge } from './ui/StatusBadge';
import { formatDate, formatDateTime, formatRelativeTime, getDaysRemaining } from '../utils/date';
import { api } from '../services/api';
import { useToast } from './ui/Toast';
import {
  Calendar,
  User as UserIcon,
  MessageSquare,
  History,
  Send,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Tag,
  Share2
} from 'lucide-react';
import { cn } from '../utils/cn';

export interface TaskDetailModalProps {
  taskId: number | null;
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User | null;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: number) => void;
  onEditClick: (task: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  isOpen,
  onClose,
  users,
  currentUser,
  onTaskUpdated,
  onTaskDeleted,
  onEditClick,
}) => {
  const { success, error: showError } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchDetails = async (id: number) => {
    setIsLoading(true);
    try {
      const res = await api.getTask(id);
      setTask(res.task);
      setComments(res.comments || []);
      setActivities(res.activities || []);
    } catch (err: any) {
      showError(err.message || 'Failed to load task details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (taskId && isOpen) {
      fetchDetails(taskId);
    } else {
      setTask(null);
      setComments([]);
      setActivities([]);
    }
  }, [taskId, isOpen]);

  const handleQuickStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await api.updateTask(task.id, { status: newStatus });
      setTask(updated);
      onTaskUpdated(updated);
      success(`Status changed to ${newStatus}`);
      // Refresh activities
      const res = await api.getTask(task.id);
      setActivities(res.activities);
    } catch (err: any) {
      showError(err.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleQuickPriorityChange = async (newPriority: TaskPriority) => {
    if (!task) return;
    try {
      const updated = await api.updateTask(task.id, { priority: newPriority });
      setTask(updated);
      onTaskUpdated(updated);
      success(`Priority changed to ${newPriority}`);
    } catch (err: any) {
      showError(err.message || 'Failed to update priority');
    }
  };

  const handleQuickAssigneeChange = async (userIdStr: string) => {
    if (!task) return;
    const newUserId = userIdStr ? parseInt(userIdStr, 10) : null;
    try {
      const updated = await api.updateTask(task.id, { assigned_to: newUserId });
      setTask(updated);
      onTaskUpdated(updated);
      success(`Assigned to ${updated.assignee_name || 'Unassigned'}`);
    } catch (err: any) {
      showError(err.message || 'Failed to update assignee');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !commentText.trim()) return;

    const authorId = currentUser?.id || users[0]?.id || 1;
    setIsPostingComment(true);
    try {
      const newComment = await api.addComment(task.id, authorId, commentText.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      success('Comment posted');
      
      // Update parent comment count
      onTaskUpdated({
        ...task,
        comment_count: (task.comment_count || 0) + 1
      });

      // Refresh activity timeline
      const res = await api.getTask(task.id);
      setActivities(res.activities);
    } catch (err: any) {
      showError(err.message || 'Failed to add comment');
    } finally {
      setIsPostingComment(false);
    }
  };

  if (!isOpen) return null;

  const deadlineInfo = task ? getDaysRemaining(task.due_date) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      showCloseButton={true}
    >
      {isLoading || !task ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading task data...</p>
        </div>
      ) : (
        <div className="space-y-6 -mt-2">
          {/* Header Bar */}
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="space-y-1.5 flex-1 min-w-[240px]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  TASK-{task.id}
                </span>
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                {deadlineInfo?.isOverdue && task.status !== 'Completed' && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                    <AlertCircle className="w-3 h-3" /> Overdue
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900 leading-snug">{task.title}</h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                onClick={() => {
                  onEditClick(task);
                }}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => onTaskDeleted(task.id)}
              >
                Delete
              </Button>
            </div>
          </div>

          {/* Quick Attributes Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            {/* Status Dropdown */}
            <div className="space-y-1">
              <span className="text-slate-500 font-medium">Status</span>
              <select
                value={task.status}
                onChange={(e) => handleQuickStatusChange(e.target.value as TaskStatus)}
                disabled={isUpdatingStatus}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>

            {/* Priority Dropdown */}
            <div className="space-y-1">
              <span className="text-slate-500 font-medium">Priority</span>
              <select
                value={task.priority}
                onChange={(e) => handleQuickPriorityChange(e.target.value as TaskPriority)}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">🔥 Urgent</option>
              </select>
            </div>

            {/* Assignee Dropdown */}
            <div className="space-y-1">
              <span className="text-slate-500 font-medium">Assignee</span>
              <select
                value={task.assigned_to ? String(task.assigned_to) : ''}
                onChange={(e) => handleQuickAssigneeChange(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date Info */}
            <div className="space-y-1">
              <span className="text-slate-500 font-medium">Due Date</span>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-300 rounded-md font-medium text-slate-800 truncate">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{task.due_date ? formatDate(task.due_date) : 'No due date'}</span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Description</h4>
            <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-200/70 text-sm text-slate-800 leading-relaxed min-h-[70px] whitespace-pre-wrap">
              {task.description || <span className="italic text-slate-400">No description provided for this task.</span>}
            </div>
          </div>

          {/* Metadata Timestamps */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div>
              <span>Created: </span>
              <span className="font-medium text-slate-700">{formatDateTime(task.created_at)}</span>
            </div>
            <div>
              <span>Last Updated: </span>
              <span className="font-medium text-slate-700">{formatRelativeTime(task.updated_at)}</span>
            </div>
          </div>

          {/* Tabs for Comments vs Activity History */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center gap-4 border-b border-slate-200 mb-4">
              <button
                onClick={() => setActiveTab('comments')}
                className={cn(
                  'flex items-center gap-2 pb-2.5 text-sm font-semibold border-b-2 transition-colors',
                  activeTab === 'comments'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Comments & Notes ({comments.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('activity')}
                className={cn(
                  'flex items-center gap-2 pb-2.5 text-sm font-semibold border-b-2 transition-colors',
                  activeTab === 'activity'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                <History className="w-4 h-4" />
                <span>Audit & History ({activities.length})</span>
              </button>
            </div>

            {/* Comments Tab View */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                {/* Comments List */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      No comments or notes yet. Start the conversation below!
                    </div>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                        {c.user_avatar ? (
                          <img
                            src={c.user_avatar}
                            alt={c.user_name || 'User'}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {c.user_name ? c.user_name.charAt(0) : 'U'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">{c.user_name || 'Team Member'}</span>
                            <span className="text-[11px] text-slate-400">{formatRelativeTime(c.created_at)}</span>
                          </div>
                          {c.user_role && <span className="text-[10px] text-slate-500 block mb-1">{c.user_role}</span>}
                          <p className="text-sm text-slate-800 whitespace-pre-wrap">{c.comment}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2 items-end pt-2">
                  <div className="flex-1">
                    <textarea
                      placeholder={`Add a comment as ${currentUser?.name || 'You'}...`}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isPostingComment}
                    disabled={!commentText.trim()}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Post
                  </Button>
                </form>
              </div>
            )}

            {/* Activity History Tab View */}
            {activeTab === 'activity' && (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No activity recorded yet for this task.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {activities.map((a) => (
                      <div key={a.id} className="relative">
                        <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                        <div className="text-xs">
                          <span className="font-semibold text-slate-900">{a.user_name || 'System'}</span>
                          <span className="text-slate-600 ml-1.5">{a.details || a.action}</span>
                          <span className="text-slate-400 block text-[11px] mt-0.5">{formatRelativeTime(a.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
