import React, { useState, useEffect, useCallback } from 'react';
import { Task, User, TaskFilterParams, DashboardMetrics, TaskStatus } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { TaskListView } from './components/TaskListView';
import { KanbanView } from './components/KanbanView';
import { ExternalApiView } from './components/ExternalApiView';
import { TeamView } from './components/TeamView';
import { TaskFormModal } from './components/TaskFormModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { TeamManagerModal } from './components/TeamManagerModal';
import { ToastProvider, useToast } from './components/ui/Toast';

function TaskManagementApp() {
  const { error: showError, success } = useToast();

  // Navigation & View state
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Users & Current Persona state
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Tasks & Filtering state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasksForKanban, setAllTasksForKanban] = useState<Task[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  const [filters, setFilters] = useState<TaskFilterParams>({
    page: 1,
    limit: 10,
    sort_by: 'updated_at',
    sort_order: 'desc',
    search: '',
  });

  // Dashboard Metrics
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  // Modals state
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Fetch Users
  const loadUsers = useCallback(async () => {
    try {
      const userList = await api.getUsers();
      setUsers(userList);
      
      const savedUserId = localStorage.getItem('taskflow_current_user_id');
      if (savedUserId) {
        const found = userList.find((u) => String(u.id) === savedUserId);
        if (found) {
          setCurrentUser(found);
          return;
        }
      }
      if (userList.length > 0) {
        setCurrentUser(userList[0]);
        localStorage.setItem('taskflow_current_user_id', String(userList[0].id));
      }
    } catch (err: any) {
      console.error('Failed to load users:', err);
    }
  }, []);

  // Fetch Dashboard
  const loadDashboard = useCallback(async (userId?: number) => {
    setIsLoadingDashboard(true);
    try {
      const metrics = await api.getDashboard(userId);
      setDashboardMetrics(metrics);
    } catch (err: any) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, []);

  // Fetch Tasks with current filters
  const loadTasks = useCallback(async () => {
    setIsLoadingTasks(true);
    try {
      const response = await api.getTasks(filters);
      setTasks(response.tasks);
      setTotalTasks(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      showError(err.message || 'Failed to load tasks');
    } finally {
      setIsLoadingTasks(false);
    }
  }, [filters, showError]);

  // Load full tasks list for Kanban view
  const loadAllTasksForKanban = useCallback(async () => {
    try {
      const response = await api.getTasks({ limit: 100 });
      setAllTasksForKanban(response.tasks);
    } catch (err) {
      console.error('Failed to load kanban tasks:', err);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (currentUser) {
      loadDashboard(currentUser.id);
    }
  }, [currentUser, loadDashboard]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (activeTab === 'kanban' || activeTab === 'team') {
      loadAllTasksForKanban();
    }
  }, [activeTab, loadAllTasksForKanban]);

  // Handlers
  const handleFilterChange = (newFilters: Partial<TaskFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      sort_by: 'updated_at',
      sort_order: 'desc',
      search: '',
      status: undefined,
      priority: undefined,
      assignee: undefined,
      overdue: undefined,
    });
  };

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('taskflow_current_user_id', String(user.id));
    loadDashboard(user.id);
  };

  const handleOpenTaskDetail = (taskId: number) => {
    setSelectedTaskId(taskId);
    setIsTaskDetailOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskFormOpen(true);
  };

  const handleOpenNewTask = () => {
    setTaskToEdit(null);
    setIsTaskFormOpen(true);
  };

  const handleTaskSaved = (savedTask: Task) => {
    loadTasks();
    loadAllTasksForKanban();
    if (currentUser) loadDashboard(currentUser.id);
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await api.deleteTask(taskId);
      success('Task deleted successfully');
      setIsTaskDetailOpen(false);
      loadTasks();
      loadAllTasksForKanban();
      if (currentUser) loadDashboard(currentUser.id);
    } catch (err: any) {
      showError(err.message || 'Failed to delete task');
    }
  };

  const handleQuickStatusUpdate = async (taskId: number, newStatus: TaskStatus) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      success(`Status updated to ${newStatus}`);
      loadTasks();
      loadAllTasksForKanban();
      if (currentUser) loadDashboard(currentUser.id);
    } catch (err: any) {
      showError(err.message || 'Failed to update status');
    }
  };

  const handleNavigateFromDashboard = (quickFilters?: { status?: string; overdue?: boolean; assignee?: number }) => {
    if (quickFilters) {
      setFilters((prev) => ({
        ...prev,
        ...quickFilters,
        page: 1,
      }));
    }
    setActiveTab('tasks');
  };

  const handleSidebarShortcut = (filterKey: string, value: any) => {
    if (filterKey === 'myTasks' && currentUser) {
      setFilters((prev) => ({ ...prev, assignee: currentUser.id, status: undefined, overdue: undefined, page: 1 }));
    } else if (filterKey === 'status') {
      setFilters((prev) => ({ ...prev, status: value, assignee: undefined, overdue: undefined, page: 1 }));
    } else if (filterKey === 'overdue') {
      setFilters((prev) => ({ ...prev, overdue: true, status: undefined, assignee: undefined, page: 1 }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        users={users}
        onOpenNewTask={handleOpenNewTask}
        onOpenTeamManager={() => setIsTeamModalOpen(true)}
        onUserSelect={handleSwitchUser}
        searchQuery={filters.search || ''}
        onSearchChange={(val) => {
          setFilters((prev) => ({ ...prev, search: val, page: 1 }));
          if (activeTab !== 'tasks') setActiveTab('tasks');
        }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 flex w-full max-w-[1700px] mx-auto">
        {/* Responsive Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          taskCounts={{
            total: dashboardMetrics?.totalTasks || totalTasks,
            pending: dashboardMetrics?.pendingTasks || 0,
            inProgress: dashboardMetrics?.inProgressTasks || 0,
            overdue: dashboardMetrics?.overdueTasks || 0,
            myTasks: dashboardMetrics?.assignedToUserTasks || 0,
          }}
          onFilterShortcut={handleSidebarShortcut}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto max-w-7xl flex flex-col">
          <div className="flex-1">
            {activeTab === 'dashboard' && (
              <DashboardView
                metrics={dashboardMetrics}
                isLoading={isLoadingDashboard}
                onNavigateToTasks={handleNavigateFromDashboard}
                onOpenNewTask={handleOpenNewTask}
                onSelectTask={handleOpenTaskDetail}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'tasks' && (
              <TaskListView
                tasks={tasks}
                total={totalTasks}
                page={filters.page || 1}
                limit={filters.limit || 10}
                totalPages={totalPages}
                isLoading={isLoadingTasks}
                filters={filters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                users={users}
                onOpenNewTask={handleOpenNewTask}
                onSelectTask={handleOpenTaskDetail}
                onEditTask={handleOpenEditTask}
                onDeleteTask={handleDeleteTask}
                onQuickStatusUpdate={handleQuickStatusUpdate}
              />
            )}

            {activeTab === 'kanban' && (
              <KanbanView
                tasks={allTasksForKanban.length > 0 ? allTasksForKanban : tasks}
                onSelectTask={handleOpenTaskDetail}
                onOpenNewTask={handleOpenNewTask}
                onStatusChange={handleQuickStatusUpdate}
              />
            )}

            {activeTab === 'external' && (
              <ExternalApiView
                onUserImported={(newUser) => {
                  setUsers((prev) => [...prev, newUser]);
                  if (currentUser) loadDashboard(currentUser.id);
                }}
              />
            )}

            {activeTab === 'team' && (
              <TeamView
                users={users}
                currentUser={currentUser}
                tasks={allTasksForKanban.length > 0 ? allTasksForKanban : tasks}
                onOpenTeamManager={() => setIsTeamModalOpen(true)}
                onSelectUser={handleSwitchUser}
                onFilterTasksByUser={(userId) => {
                  setFilters((prev) => ({ ...prev, assignee: userId, page: 1 }));
                  setActiveTab('tasks');
                }}
              />
            )}
          </div>

          <footer className="mt-8 pt-4 pb-2 border-t border-slate-200/80 text-center">
            <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
              React + FastAPI + PostgreSQL Stack | Internal Deployment v1.0.4
            </p>
          </footer>
        </main>
      </div>

      {/* Create / Edit Task Modal */}
      <TaskFormModal
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        taskToEdit={taskToEdit}
        users={users}
        onSuccess={handleTaskSaved}
      />

      {/* Task Details Modal (Deep Dive, Comments & History) */}
      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={isTaskDetailOpen}
        onClose={() => {
          setIsTaskDetailOpen(false);
          setSelectedTaskId(null);
        }}
        users={users}
        currentUser={currentUser}
        onTaskUpdated={handleTaskSaved}
        onTaskDeleted={handleDeleteTask}
        onEditClick={(task) => {
          setIsTaskDetailOpen(false);
          handleOpenEditTask(task);
        }}
      />

      {/* Team Directory & Persona Manager Modal */}
      <TeamManagerModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onUserCreated={(newUser) => {
          setUsers((prev) => [...prev, newUser]);
        }}
        onCurrentUserChange={handleSwitchUser}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <TaskManagementApp />
    </ToastProvider>
  );
}
