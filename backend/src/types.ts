export const ROLES = ['STUDENT', 'LECTURER', 'ADMIN', 'COMMITTEE_MEMBER'] as const;
export type Role = (typeof ROLES)[number];

export const isRole = (value: unknown): value is Role =>
  typeof value === 'string' && (ROLES as readonly string[]).includes(value);

export interface User {
  id: string;
  email: string;
  fullName: string;
  displayName: string;
  passwordHash: string;
  role: Role;
  xp: number;
  createdAt: Date;
}

export interface Module {
  id: string;
  code: string;
  name: string;
  credits: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type NewUser = Pick<User, 'email' | 'fullName' | 'displayName' | 'passwordHash' | 'role'>;
export type PublicUser = Omit<User, 'passwordHash'>;
export type NewModule = Pick<Module, 'code' | 'name' | 'credits'> & {description?: string | null;}; // description is optional
export type EditModule = Partial<NewModule>; // makes every property of NewModule optional for when editing it.
export type EditUser = Partial<Pick<User, 'email' | 'fullName' | 'displayName' | 'role' | 'xp'>>; // makes every property of NewUser optional for when editing it.

export interface AuthContext {
  userId: string;
  role: Role;
}
