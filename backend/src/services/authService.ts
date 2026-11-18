import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { AppConfig } from '../config';
import { AppError } from '../errors';
import { UserRepository } from '../repositories/userRepository';

//import the types and validation
import { AuthContext, PublicUser, User, isRole, EditUser } from '../types';
import { LoginInput, RegisterInput } from '../validation/authSchemas';

export const toPublicUser = (u: User): PublicUser => ({
  id: u.id,
  email: u.email,
  fullName: u.fullName,
  displayName: u.displayName,
  role: u.role,
  xp: u.xp,
  createdAt: u.createdAt,
});

export interface AuthResult {
  user: PublicUser;
  token: string;
}

export class AuthService {
  // Used to keep login timing similar when the email does not exist.
  private readonly dummyHash: string;

  constructor(
    private readonly users: UserRepository,
    private readonly config: AppConfig,
  ) {
    this.dummyHash = bcrypt.hashSync('not-a-real-password', config.bcryptRounds);
  }

  async register(input: RegisterInput): Promise<AuthResult> {
    if (await this.users.findByEmail(input.email)) {
      throw new AppError(409, 'Email already registered', 'EMAIL_TAKEN');
    }
    const passwordHash = await bcrypt.hash(input.password, this.config.bcryptRounds);
    const user = await this.users.create({
      email: input.email,
      fullName: input.fullName,
      displayName: input.displayName ?? input.fullName,
      passwordHash,
      role: input.accountType,
    });
    return { user: toPublicUser(user), token: this.signToken(user) };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.users.findByEmail(input.email);
    const ok = await bcrypt.compare(input.password, user?.passwordHash ?? this.dummyHash);
    if (!user || !ok) {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }
    return { user: toPublicUser(user), token: this.signToken(user) };
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) throw new AppError(401, 'Account no longer exists', 'INVALID_TOKEN');
    return toPublicUser(user);
  }

  async listUsers(): Promise<PublicUser[]> {
    return (await this.users.list()).map(toPublicUser); //converts to "toPublicUser" to omit passwordHash etc...
  }

  signToken(user: User): string {
    return jwt.sign({ role: user.role }, this.config.jwtSecret, {
      subject: user.id,
      algorithm: 'HS256',
      expiresIn: this.config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  /** Throws if the token is invalid, expired or malformed. */
  verifyToken(token: string): AuthContext {
    const payload = jwt.verify(token, this.config.jwtSecret, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || !payload.sub || !isRole(payload.role)) {
      throw new Error('Malformed token payload');
    }
    return { userId: payload.sub, role: payload.role };
  }

  // admin

  async updateUserRole(id: string, role: unknown): Promise<PublicUser> {
    if (!isRole(role)) {
      throw new AppError(400, 'Invalid user role', 'INVALID_ROLE');
    }

    const updatedUser = await this.users.updateRole(id, role);

    return toPublicUser(updatedUser);
  }

  async deleteUser(id: string): Promise<PublicUser> {
    const deletedUser = await this.users.delete(id);

    return toPublicUser(deletedUser);
  }

  async editUser(id: string, data: EditUser): Promise<PublicUser> {
    if (Object.keys(data).length === 0) {
      throw new AppError(400, 'No fields provided for update', 'EMPTY_UPDATE');
    }

    if (data.email !== undefined && !data.email.trim()) {
      throw new AppError(400, 'Email cannot be empty', 'INVALID_EMAIL');
    }

    if (data.fullName !== undefined && !data.fullName.trim()) {
      throw new AppError(400, 'Full name cannot be empty', 'INVALID_FULL_NAME');
    }

    if (data.displayName !== undefined && !data.displayName.trim()) {
      throw new AppError(400, 'Display name cannot be empty', 'INVALID_DISPLAY_NAME');
    }

    if (data.role !== undefined && !isRole(data.role)) {
      throw new AppError(400, 'Invalid user role', 'INVALID_ROLE');
    }

    if (data.xp !== undefined &&
      (!Number.isInteger(data.xp) || data.xp <= 0)) {
      throw new AppError(400, 'XP must be a positive integer', 'INVALID_XP');
    }

    const updatedUser = await this.users.edit(id, data);

    return toPublicUser(updatedUser);
  }

}
