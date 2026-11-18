import type { PrismaClient } from '@prisma/client';
import { AppError } from '../errors';
import { Module, NewModule, EditModule } from '../types';
import { ModuleRepository } from './moduleRepository';

export class PrismaModuleRepository implements ModuleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: NewModule): Promise<Module> {
    try {
      return await this.prisma.module.create({
        data,
      });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new AppError(409, 'Module code already exists', 'MODULE_CODE_TAKEN');
      }
      throw err;
    }
  }

  async list(): Promise<Module[]> {
    return this.prisma.module.findMany({ orderBy: { createdAt: 'asc'} });
  }

  async edit(id: string, data: EditModule): Promise<Module> {
    try {
      return await this.prisma.module.update({
        where: { id },
        data,
      });
    } catch (err) {
      const code = (err as { code?: string }).code;

      if (code === 'P2025') {
        throw new AppError(404, 'Module not found', 'MODULE_NOT_FOUND');
      }

      if (code === 'P2002') {
        throw new AppError(409, 'Module code already exists', 'MODULE_CODE_TAKEN');
      }

      throw err;
    }
  }

  async delete(id: string): Promise<Module> {
    try {
      return await this.prisma.module.delete({
        where: { id },
      });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2025') {
        throw new AppError(404, 'Module not found', 'NOT_FOUND');
      }
      throw err;
    }
  }

}