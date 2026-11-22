import cors from 'cors';
import express, { Express } from 'express';
import path from 'path';

import helmet from 'helmet';
import { AppConfig } from './config';
import { AppError } from './errors';
import { errorHandler } from './middleware/errorHandler';
import { UserRepository } from './repositories/userRepository';
import { authRoutes } from './routes/authRoutes';
import { userRoutes } from './routes/userRoutes';
import { AuthService } from './services/authService';

import { ModuleRepository } from './repositories/moduleRepository';
import { moduleRoutes } from './routes/moduleRoutes';
import { ModuleService } from './services/moduleService';

import { LeaderboardRepository } from './repositories/leaderboardRepository';
import { leaderboardRoutes } from './routes/leaderboardRoutes';
import { LeaderboardService } from './services/leaderboardService';

export interface AppDeps {
  userRepo: UserRepository;
  moduleRepo: ModuleRepository;
  leaderboardRepo: LeaderboardRepository;
  config: AppConfig;
}

export function createApp({ userRepo, config, moduleRepo, leaderboardRepo }: AppDeps): Express {
  const app = express();
  const auth = new AuthService(userRepo, config);
  const modules = new ModuleService(moduleRepo);
  const leaderboard = new LeaderboardService(leaderboardRepo);

  app.disable('x-powered-by');
  app.use(
    helmet({
      // Default CSP upgrades requests to https, which breaks plain http://localhost
      contentSecurityPolicy: { directives: { upgradeInsecureRequests: null } },
    }),
  );
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Root URL opens the login page
  app.get('/', (_req, res) => {
    res.redirect('/auth/login/');
  });

  // Frontend pages (../frontend) served from the same origin as the API, so no CORS needed
  app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

  //routes
  app.use('/api/auth', authRoutes(auth, config));
  app.use('/api/users', userRoutes(auth));
  app.use('/api/modules', moduleRoutes(modules, auth));
  app.use('/api/leaderboard', leaderboardRoutes(leaderboard, auth));

  app.use((_req, _res, next) => next(new AppError(404, 'Route not found', 'NOT_FOUND')));
  app.use(errorHandler);
  return app;
}
