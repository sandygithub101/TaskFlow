# TaskFlow — Enterprise Task Management Platform

TaskFlow is a production-grade, full-stack internal enterprise task management and team orchestration platform built with **React 19**, **Tailwind CSS**, **TypeScript**, **Python / FastAPI**, and **SQLite / PostgreSQL**.

---

## 🌟 Key Features

### 1. Executive Analytics Dashboard
- Real-time aggregate scorecards: **Total Tasks**, **Pending Tasks**, **In Progress Tasks**, **Completed Tasks**, **Overdue Tasks**, and **Tasks Assigned to Current User**.
- Visual Priority Breakdown (Low, Medium, High, Urgent).
- Upcoming Deadlines tracker with auto-calculated countdowns and overdue warnings.
- Real-time workspace activity audit log.

### 2. Task Management & Workflows
- **Full CRUD**: Create, edit, inspect, and delete tasks.
- **Workflow State Machine**: Status transitions across `Pending`, `In Progress`, `Completed`, and `Blocked`.
- **Prioritization**: `Low`, `Medium`, `High`, `Urgent`.
- **Team Assignment**: Dynamic assignees with role badges and avatar indicators.
- **Comments & Collaboration**: Threaded comments, timestamps, author roles, and activity tracking.
- **Kanban Board**: Visual drag-and-drop / column organization.

### 3. High-Performance Task List & Filtering
- Search across titles and descriptions with debounce.
- Multi-dimensional filters: Status, Priority, Assignee, and Overdue deadlines.
- Multi-column sort: Due date, Created date, Updated date, Priority, Status, Title.
- Server-side pagination with configurable page limits (5, 10, 20, 50).

### 4. External REST API Integration
- Public REST API integration with `GET /api/external/users`.
- Demonstrates latency monitoring (ms), rate-limiting header inspection, client-side caching (TTL), timeout handling (AbortController), and 1-click **Import to Team Directory**.

---

## 🏗️ Project Architecture

```
project/
├── backend/                  # Python + FastAPI Standalone Backend
│   ├── routes/              # Modular API routers (tasks, users, dashboard, external)
│   ├── services/            # Business logic and external API clients
│   ├── models/              # SQLAlchemy Database models (Task, User, Comment)
│   ├── schemas/             # Pydantic validation schemas
│   ├── repositories/        # Database query repositories (Separation of concerns)
│   ├── database.py          # Database connection pool (SQLite / PostgreSQL)
│   ├── main.py              # FastAPI application entrypoint
│   └── requirements.txt     # Python backend dependencies
│
├── server/                   # Full-Stack Express + SQLite Backend (Node.js)
│   ├── database/            # SQLite WASM engine & auto-seeding
│   ├── models/              # TypeScript data interfaces
│   ├── repositories/        # Repository pattern for database queries
│   ├── services/            # Services for business workflows & external REST
│   ├── schemas/             # Zod input validation schemas
│   └── routes/              # Express REST endpoints
│
├── src/                      # Frontend Application (React 19 + Vite)
│   ├── components/
│   │   ├── ui/              # Reusable UI library (Button, Modal, Input, Table, Pagination, Badges, etc.)
│   │   ├── DashboardView.tsx
│   │   ├── TaskListView.tsx
│   │   ├── KanbanView.tsx
│   │   ├── ExternalApiView.tsx
│   │   ├── TeamView.tsx
│   │   ├── TaskFormModal.tsx
│   │   ├── TaskDetailModal.tsx
│   │   └── TeamManagerModal.tsx
│   ├── services/            # API client service layer
│   ├── types/               # TypeScript interfaces and domain types
│   ├── utils/               # Formatting, date calculations, class merging
│   └── App.tsx              # Main application root
│
├── server.ts                 # Full-stack dev & production server
└── metadata.json
```

---

## 🗄️ Database Schema & Relationships

### `users` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique user identifier |
| `name` | TEXT | NOT NULL | Full name of team member |
| `email` | TEXT | UNIQUE, NOT NULL | Corporate email address |
| `role` | TEXT | NOT NULL DEFAULT 'Member' | Engineering role / title |
| `avatar` | TEXT | NULLABLE | Profile photo URL |
| `created_at` | TEXT / DATETIME | NOT NULL | User registration timestamp |

### `tasks` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique task identifier |
| `title` | TEXT | NOT NULL | Task summary |
| `description` | TEXT | NULLABLE | Detailed requirements & notes |
| `status` | TEXT | NOT NULL (Pending/In Progress/Completed/Blocked) | Current workflow state |
| `priority` | TEXT | NOT NULL (Low/Medium/High/Urgent) | Urgency rating |
| `assigned_to`| INTEGER | FOREIGN KEY -> `users(id)` | Assignee |
| `due_date` | TEXT | NULLABLE (YYYY-MM-DD) | Target deadline |
| `created_at` | TEXT / DATETIME | NOT NULL | Creation timestamp |
| `updated_at` | TEXT / DATETIME | NOT NULL | Last modified timestamp |

### `comments` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique comment identifier |
| `task_id` | INTEGER | FOREIGN KEY -> `tasks(id)` ON DELETE CASCADE | Associated task |
| `user_id` | INTEGER | FOREIGN KEY -> `users(id)` ON DELETE CASCADE | Comment author |
| `comment` | TEXT | NOT NULL | Text payload |
| `created_at` | TEXT / DATETIME | NOT NULL | Posted timestamp |

---

## 🔌 REST API Endpoints

### Tasks API
- `GET /api/tasks` — List tasks with server-side query filters:
  - `status`: Filter by status (`Pending`, `In Progress`, `Completed`, `Blocked`)
  - `priority`: Filter by priority (`Low`, `Medium`, `High`, `Urgent`)
  - `assignee`: Filter by user ID (`?assignee=2`)
  - `search`: Full text search (`?search=database`)
  - `overdue`: Overdue tasks filter (`?overdue=true`)
  - `sort_by`: Sort column (`due_date`, `created_at`, `updated_at`, `priority`, `title`)
  - `sort_order`: `asc` or `desc`
  - `page` & `limit`: Server-side pagination (`?page=1&limit=10`)
- `GET /api/tasks/:id` — Retrieve task details with comments & activity history
- `POST /api/tasks` — Create task with payload validation
- `PUT /api/tasks/:id` — Update task attributes
- `DELETE /api/tasks/:id` — Delete task
- `POST /api/tasks/:id/comments` — Post comment on task

### Users API
- `GET /api/users` — List team directory
- `GET /api/users/:id` — Get user profile
- `POST /api/users` — Create new team member

### Dashboard API
- `GET /api/dashboard?user_id=1` — Aggregate metrics and priority charts

### External Integration API
- `GET /api/external/users` — Public API sync with telemetry and caching
- `POST /api/external/import` — Import external employee profile into database
