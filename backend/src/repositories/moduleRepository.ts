import { Module, NewModule, EditModule } from '../types';

export interface ModuleRepository {
  create(data: NewModule): Promise<Module>;
  list(): Promise<Module[]>;
  edit(id: string, data: EditModule): Promise<Module>;
  delete(id: string): Promise<Module>;
}