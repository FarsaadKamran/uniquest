export interface AppConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  corsOrigin: string;
  authRateLimitMax: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters long');
  }
  return {
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN ?? '1h',
    bcryptRounds: Number(env.BCRYPT_ROUNDS ?? 12),
    corsOrigin: env.CORS_ORIGIN ?? 'http://localhost:5173',
    authRateLimitMax: Number(env.AUTH_RATE_LIMIT_MAX ?? 20),
  };
}
