import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;
const DB_FILE_PATH = path.join(process.cwd(), 'tasks.sqlite');

export async function getDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('Could not read existing SQLite file, creating new database:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  initializeSchema(dbInstance);
  saveDatabase(dbInstance);

  return dbInstance;
}

export function saveDatabase(db: Database) {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE_PATH, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

function initializeSchema(db: Database) {
  // Create tables
  db.run(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'Member',
      avatar TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'Pending', -- Pending, In Progress, Completed, Blocked
      priority TEXT NOT NULL DEFAULT 'Medium', -- Low, Medium, High, Urgent
      assigned_to INTEGER,
      due_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Check if seed data is needed
  const userCountResult = db.exec('SELECT COUNT(*) as count FROM users');
  const userCount = userCountResult[0]?.values[0]?.[0] as number || 0;

  if (userCount === 0) {
    seedInitialData(db);
  }
}

function seedInitialData(db: Database) {
  const now = new Date().toISOString();
  const pastDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  };
  const futureDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  // Seed Users
  db.run(`
    INSERT INTO users (name, email, role, avatar, created_at) VALUES 
    ('Alex Morgan', 'alex.morgan@taskflow.internal', 'Lead Architect', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '${pastDate(30)}'),
    ('David Chen', 'david.chen@taskflow.internal', 'Senior Backend Engineer', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', '${pastDate(28)}'),
    ('Sarah Jenkins', 'sarah.jenkins@taskflow.internal', 'Product Designer', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', '${pastDate(25)}'),
    ('Michael Torres', 'michael.torres@taskflow.internal', 'DevOps & Cloud Lead', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', '${pastDate(20)}'),
    ('Elena Rostova', 'elena.rostova@taskflow.internal', 'QA Automation Lead', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', '${pastDate(15)}')
  `);

  // Seed Tasks
  const tasks = [
    {
      title: 'Upgrade production database cluster to PostgreSQL 16',
      description: 'Perform rolling zero-downtime maintenance and verify read-replica replication lag with automated telemetry alerts.',
      status: 'In Progress',
      priority: 'Urgent',
      assigned_to: 4,
      due_date: futureDate(-2), // Overdue
      created_at: pastDate(7),
      updated_at: pastDate(1),
    },
    {
      title: 'Refactor Shopify webhook ingestion pipeline',
      description: 'Ensure idempotent request handling with Redis locks and backoff queues for high-concurrency order webhooks.',
      status: 'In Progress',
      priority: 'High',
      assigned_to: 2,
      due_date: futureDate(3),
      created_at: pastDate(5),
      updated_at: pastDate(2),
    },
    {
      title: 'Implement Dark Mode and Design System Tokens',
      description: 'Audit WCAG AA compliance across contrast ratios and generate cohesive Tailwind color utility mappings.',
      status: 'Completed',
      priority: 'Medium',
      assigned_to: 3,
      due_date: futureDate(-5),
      created_at: pastDate(14),
      updated_at: pastDate(3),
    },
    {
      title: 'Audit SSO OAuth token refresh latency',
      description: 'Profile Google Workspace and Azure AD token exchange handshakes to reduce authorization overhead from 450ms to <100ms.',
      status: 'Pending',
      priority: 'High',
      assigned_to: 1,
      due_date: futureDate(1),
      created_at: pastDate(3),
      updated_at: pastDate(3),
    },
    {
      title: 'Integrate external user directory synchronization',
      description: 'Build scheduled background worker to sync employee directory with external corporate REST API and auto-provision accounts.',
      status: 'In Progress',
      priority: 'Medium',
      assigned_to: 1,
      due_date: futureDate(5),
      created_at: pastDate(4),
      updated_at: pastDate(1),
    },
    {
      title: 'Fix race condition in concurrent comment mentions',
      description: 'Database deadlock observed during simultaneous notification dispatch on high-traffic task threads.',
      status: 'Blocked',
      priority: 'Urgent',
      assigned_to: 2,
      due_date: futureDate(-1), // Overdue
      created_at: pastDate(6),
      updated_at: pastDate(1),
    },
    {
      title: 'End-to-End Cypress test coverage for task workflow',
      description: 'Write automated browser test suites covering task creation, inline status drag-and-drop, and filtering criteria.',
      status: 'Pending',
      priority: 'Low',
      assigned_to: 5,
      due_date: futureDate(10),
      created_at: pastDate(2),
      updated_at: pastDate(2),
    },
    {
      title: 'Setup automated security vulnerability scan in CI/CD',
      description: 'Integrate Trivy and Snyk checks into GitHub Actions pipeline before triggering deployment containers.',
      status: 'Completed',
      priority: 'High',
      assigned_to: 4,
      due_date: futureDate(-10),
      created_at: pastDate(18),
      updated_at: pastDate(8),
    },
    {
      title: 'Design interactive analytics widgets for executive dashboard',
      description: 'Create interactive charts and KPI scorecards with SVG graphs and exportable CSV reports for management.',
      status: 'Pending',
      priority: 'Medium',
      assigned_to: 3,
      due_date: futureDate(7),
      created_at: pastDate(1),
      updated_at: pastDate(1),
    },
    {
      title: 'Document REST API schema specifications and OpenAPI/Swagger',
      description: 'Publish complete developer documentation for internal service endpoints with example payloads and error responses.',
      status: 'Completed',
      priority: 'Low',
      assigned_to: 1,
      due_date: futureDate(-3),
      created_at: pastDate(10),
      updated_at: pastDate(2),
    }
  ];

  for (const t of tasks) {
    db.run(
      `INSERT INTO tasks (title, description, status, priority, assigned_to, due_date, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.title, t.description, t.status, t.priority, t.assigned_to, t.due_date, t.created_at, t.updated_at]
    );
  }

  // Seed Comments
  const comments = [
    {
      task_id: 1,
      user_id: 4,
      comment: 'Initial benchmark shows slave replica is syncing with <15ms latency. Maintenance window scheduled for 02:00 UTC.',
      created_at: pastDate(2)
    },
    {
      task_id: 1,
      user_id: 1,
      comment: 'Approved the maintenance plan. Make sure we take a snapshot of the primary storage volume beforehand.',
      created_at: pastDate(1)
    },
    {
      task_id: 2,
      user_id: 2,
      comment: 'Redis distributed locks prevent duplicate invoice creations on webhook retries. Unit tests passed.',
      created_at: pastDate(2)
    },
    {
      task_id: 6,
      user_id: 2,
      comment: 'Blocked waiting on database isolation level adjustments from DevOps team.',
      created_at: pastDate(1)
    },
    {
      task_id: 3,
      user_id: 3,
      comment: 'All Figma design tokens have been exported into Tailwind color classes and verified with high contrast checkers.',
      created_at: pastDate(4)
    }
  ];

  for (const c of comments) {
    db.run(
      `INSERT INTO comments (task_id, user_id, comment, created_at) VALUES (?, ?, ?, ?)`,
      [c.task_id, c.user_id, c.comment, c.created_at]
    );
  }

  // Seed Activity Logs
  const activities = [
    { task_id: 1, user_id: 4, action: 'STATUS_CHANGE', details: 'Changed status to In Progress', created_at: pastDate(3) },
    { task_id: 2, user_id: 2, action: 'ASSIGNMENT', details: 'Assigned task to David Chen', created_at: pastDate(5) },
    { task_id: 3, user_id: 3, action: 'STATUS_CHANGE', details: 'Marked task as Completed', created_at: pastDate(3) },
    { task_id: 6, user_id: 2, action: 'STATUS_CHANGE', details: 'Marked task as Blocked', created_at: pastDate(1) }
  ];

  for (const a of activities) {
    db.run(
      `INSERT INTO activity_logs (task_id, user_id, action, details, created_at) VALUES (?, ?, ?, ?, ?)`,
      [a.task_id, a.user_id, a.action, a.details, a.created_at]
    );
  }
}
