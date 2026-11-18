import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthService } from '../services/authService';

export function userRoutes(auth: AuthService): Router {
  const router = Router();

  // "As an administrator, I want to view registered users"
  router.get(
    '/',
    requireAuth(auth),
    requireRole('ADMIN'),
    asyncHandler(async (_req, res) => {
      res.json({ users: await auth.listUsers() });
    }),
  );

  // as an admin i want to view an individual user
  router.get(
    '/:id',
    requireAuth(auth),
    requireRole('ADMIN'),
    asyncHandler(async (req, res) => {
      res.json({ user: await auth.getProfile(req.params.id!) });
    }),
  );

  // as an admin i want to change a user's role
  router.patch(
    '/:id/role',
    requireAuth(auth),
    requireRole('ADMIN'),
    asyncHandler(async (req, res) => {
      const updatedUser = await auth.updateUserRole(
        req.params.id!,
        req.body.role,
      );

      res.json({ user: updatedUser });

    }),
  );

  // as an admin i want to permanently delete a user
  router.delete(
    '/:id',
    requireAuth(auth),
    requireRole('ADMIN'),
    asyncHandler(async (req, res) => {
      const deletedUser = await auth.deleteUser(req.params.id!);

      res.json({
        message: 'User successfully deleted',
        user: deletedUser,
      });
    }),
  );

  router.patch(
    '/:id',
    requireAuth(auth),
    requireRole('ADMIN'),
    asyncHandler(async (req, res) => {
      const updatedUser = await auth.editUser(req.params.id!, req.body);
      res.json({ user: updatedUser });
    })
  );

  return router;
}
