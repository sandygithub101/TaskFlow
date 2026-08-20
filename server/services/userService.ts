import { userRepository } from '../repositories/userRepository';
import { User } from '../models';

export class UserService {
  async getAllUsers(): Promise<User[]> {
    return await userRepository.findAll();
  }

  async getUserById(id: number): Promise<User | null> {
    return await userRepository.findById(id);
  }

  async createUser(data: { name: string; email: string; role?: string; avatar?: string | null }): Promise<User> {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new Error(`User with email "${data.email}" already exists`);
    }
    return await userRepository.create(data);
  }
}

export const userService = new UserService();
