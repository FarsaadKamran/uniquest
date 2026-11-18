import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AppConfig } from '../config';

//importing the middleware
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

//import services
import { AuthService } from '../services/authService';

//import the types and validation
import { AuthContext } from '../types';
import { loginSchema, parseBody, registerSchema } from '../validation/authSchemas';

export function authRoutes(auth: AuthService, config: AppConfig): Router {
  const router = Router();
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.authRateLimitMax,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });

  router.post(
    '/register',
    limiter,
    asyncHandler(async (req, res) => {
      const result = await auth.register(parseBody(registerSchema, req.body));
      res.status(201).json(result);
    }),
  );

  router.post(
    '/login',
    limiter,
    asyncHandler(async (req, res) => {
      const result = await auth.login(parseBody(loginSchema, req.body));
      res.status(200).json(result);
    }),
  );

  router.get(
    '/me',
    requireAuth(auth),
    asyncHandler(async (_req, res) => {
      const ctx = res.locals.auth as AuthContext;
      res.json({ user: await auth.getProfile(ctx.userId) });
    }),
  );

  return router;
}
