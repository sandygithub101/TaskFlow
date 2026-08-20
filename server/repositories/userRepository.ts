import { getDatabase, saveDatabase } from '../database/sqlite';
import { User } from '../models';

export class UserRepository {
  async findAll(): Promise<User[]> {
    const db = await getDatabase();
    const result = db.exec('SELECT id, name, email, role, avatar, created_at FROM users ORDER BY name ASC');
    if (!result.length) return [];

    const columns = result[0].columns;
    return result[0].values.map((row) => {
      const user: any = {};
      columns.forEach((col, index) => {
        user[col] = row[index];
      });
      return user as User;
    });
  }

  async findById(id: number): Promise<User | null> {
    const db = await getDatabase();
    const stmt = db.prepare('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?');
    stmt.bind([id]);
    
    if (stmt.step()) {
      const user = stmt.getAsObject() as unknown as User;
      stmt.free();
      return user;
    }
    stmt.free();
    return null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const db = await getDatabase();
    const stmt = db.prepare('SELECT id, name, email, role, avatar, created_at FROM users WHERE LOWER(email) = LOWER(?)');
    stmt.bind([email]);
    
    if (stmt.step()) {
      const user = stmt.getAsObject() as unknown as User;
      stmt.free();
      return user;
    }
    stmt.free();
    return null;
  }

  async create(userData: { name: string; email: string; role?: string; avatar?: string | null }): Promise<User> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const avatar = userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`;

    db.run(
      'INSERT INTO users (name, email, role, avatar, created_at) VALUES (?, ?, ?, ?, ?)',
      [userData.name, userData.email, userData.role || 'Member', avatar, now]
    );

    saveDatabase(db);

    const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
    let newId = 0;
    if (lastIdResult.length > 0 && lastIdResult[0].values.length > 0) {
      newId = Number(lastIdResult[0].values[0][0]);
    }
    if (!newId) {
      const maxIdResult = db.exec('SELECT MAX(id) as id FROM users');
      newId = Number(maxIdResult[0]?.values[0]?.[0] || 0);
    }
    const createdUser = await this.findById(newId);
    if (!createdUser) {
      throw new Error(`Failed to retrieve newly created user with id ${newId}`);
    }
    return createdUser;
  }
}

export const userRepository = new UserRepository();
