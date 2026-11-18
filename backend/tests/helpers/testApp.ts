import bcrypt from 'bcrypt';
import { createApp } from '../../src/app';
import { AppConfig } from '../../src/config';
import { Role } from '../../src/types';
import { InMemoryUserRepository } from './inMemoryUserRepository';

export const testConfig: AppConfig = {
  jwtSecret: 'test-secret-test-secret-test-secret-123',
  jwtExpiresIn: '1h',
  bcryptRounds: 4, // fast hashing in tests
  corsOrigin: '*',
  authRateLimitMax: 1000,
};

export function buildTestApp() {
  const repo = new InMemoryUserRepository();
  const app = createApp({ userRepo: repo, config: testConfig });
  return { app, repo };
}

export const validStudent = {
  accountType: 'STUDENT',
  fullName: 'Alex Morgan',
  email: 'alex.morgan@mumail.ie',
  displayName: 'Alex M.',
  password: 'supersecret1',
};

/** Insert a user directly (e.g. an admin, who cannot self-register). */
export async function seedUser(
  repo: InMemoryUserRepository,
  overrides: { email: string; password: string; role: Role },
) {
  return repo.create({
    email: overrides.email,
    fullName: 'Seeded User',
    displayName: 'Seeded',
    passwordHash: await bcrypt.hash(overrides.password, testConfig.bcryptRounds),
    role: overrides.role,
  });
}
