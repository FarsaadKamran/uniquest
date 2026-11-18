import { RequestHandler } from 'express';
import { AppError } from '../errors';

//import the services
import { AuthService } from '../services/authService';

//import the types
import { AuthContext, Role } from '../types';

export const requireAuth =
  (auth: AuthService): RequestHandler =>
  (req, res, next) => {
    const [scheme, token] = req.header('authorization')?.split(' ') ?? [];
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return next(new AppError(401, 'Authentication required', 'UNAUTHENTICATED'));
    }
    try {
      res.locals.auth = auth.verifyToken(token);
      return next();
    } catch {
      return next(new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN'));
    }
  };

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (_req, res, next) => {
    const ctx = res.locals.auth as AuthContext | undefined;
    if (!ctx || !roles.includes(ctx.role)) {
      return next(new AppError(403, 'You do not have permission to do this', 'FORBIDDEN'));
    }
    return next();
  };
