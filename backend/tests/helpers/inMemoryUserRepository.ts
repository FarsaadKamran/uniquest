import { randomUUID } from 'crypto';
import { AppError } from '../../src/errors';
import { UserRepository } from '../../src/repositories/userRepository';
import { NewUser, User } from '../../src/types';

export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];

  async findByEmail(email: string) {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async findById(id: string) {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async create(data: NewUser) {
    if (await this.findByEmail(data.email)) {
      throw new AppError(409, 'Email already registered', 'EMAIL_TAKEN');
    }
    const user: User = { ...data, id: randomUUID(), xp: 0, createdAt: new Date() };
    this.users.push(user);
    return user;
  }

  async list() {
    return [...this.users];
  }
}
