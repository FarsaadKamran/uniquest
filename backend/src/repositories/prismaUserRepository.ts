import type { PrismaClient } from '@prisma/client';
import { AppError } from '../errors';
import { NewUser, User, Role, EditUser } from '../types';
import { UserRepository } from './userRepository';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: NewUser): Promise<User> {
    try {
      return await this.prisma.user.create({ data });
    } catch (err) {
      // P2002 = unique constraint violation (race between findByEmail and create)
      if ((err as { code?: string }).code === 'P2002') {
        throw new AppError(409, 'Email already registered', 'EMAIL_TAKEN');
      }
      throw err;
    }
  }

  list(): Promise<User[]> {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  }

  // admin specific functions

  async updateRole(id: string, role: Role): Promise<User> {
  try {
    return await this.prisma.user.update({
      where: { id },
      data: { role },
    });
  } catch (err) {
    if ((err as { code?: string }).code === 'P2025') {
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    }
    throw err;
  }
}

async delete(id: string): Promise<User> {
  try {
    return await this.prisma.user.delete({
      where: { id },
    });
  } catch (err) {
    if ((err as { code?: string }).code === 'P2025') {
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    }
    throw err;
  }
}

  async edit(id: string, data: EditUser): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
      });
    } catch (err) {
      const code = (err as { code?: string }).code;

      if (code === 'P2025') {
        throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
      }

      if (code === 'P2002') {
        throw new AppError(409, 'Email already taken', 'USER_EMAIL_TAKEN');
      }

      throw err;
    }
  }

}
