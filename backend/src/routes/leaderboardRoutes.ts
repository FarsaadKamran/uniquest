import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthService } from '../services/authService';
import { LeaderboardService } from '../services/leaderboardService';
import { AuthContext } from '../types';

export function leaderboardRoutes(leaderboard: LeaderboardService, auth: AuthService): Router {
  const router = Router();

  // GET /api/leaderboard?period=today|week|month|year|all&limit=50
  // Any logged-in user (student, lecturer, admin, committee member) can view it.
  router.get(
    '/',
    requireAuth(auth),
    asyncHandler(async (req, res) => {
      const ctx = res.locals.auth as AuthContext;
      const period = typeof req.query.period === 'string' ? req.query.period : 'week';

      const rawLimit = Number(req.query.limit);
      const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 50;

      res.set('Cache-Control', 'no-store'); // always fresh numbers
      res.json(await leaderboard.getLeaderboard(period, ctx, limit));
    }),
  );

  return router;
}
