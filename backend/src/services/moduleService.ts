import { AppError } from '../errors';
import { ModuleRepository } from '../repositories/moduleRepository';
import { NewModule, EditModule } from '../types';

export class ModuleService {
  constructor(private readonly modules: ModuleRepository) {}

    async createModule(data: NewModule) {
        // Validation and creation logic will go here
        if (!data.code || !data.name) {
            throw new AppError(400, 'Module code and name are required', 'INVALID_MODULE');
        }

        if (data.credits <= 0) {
            throw new AppError(400, 'Credits must be greater than zero', 'INVALID_CREDITS');
        }

        // no need to check for duplicate module codes since prismaModuleRepository.ts already catches prisma's unique constraint violation error.

        return this.modules.create(data);
    }

    async listModules() {
        return this.modules.list();
    }

    async editModule(id: string, data: EditModule) {
        if (Object.keys(data).length === 0) {
            throw new AppError(400, 'No fields provided for update', 'EMPTY_UPDATE');
        }

        if (data.code !== undefined && !data.code.trim()) {
            throw new AppError(400, 'Module code cannot be empty', 'INVALID_MODULE_CODE');
        }

        if (data.name !== undefined && !data.name.trim()) {
            throw new AppError(400, 'Module name cannot be empty', 'INVALID_MODULE_NAME');
        }

        if (data.credits !== undefined &&
            (!Number.isInteger(data.credits) || data.credits <= 0)) {
            throw new AppError(400, 'Credits must be a positive integer', 'INVALID_CREDITS');
        }

        return this.modules.edit(id, data);
    }

    async deleteModule(id: string) {
        return this.modules.delete(id);
    }
}