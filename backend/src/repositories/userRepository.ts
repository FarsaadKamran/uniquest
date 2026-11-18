import { NewUser, User, Role, EditUser } from '../types';

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: NewUser): Promise<User>;
  list(): Promise<User[]>;
  updateRole(id: string, role: Role): Promise<User>;
  delete(id: string): Promise<User>;
  edit(id: string, data: EditUser): Promise<User>;
}
