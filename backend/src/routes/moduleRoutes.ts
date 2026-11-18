
import { Router } from 'express';
import { ModuleService } from '../services/moduleService';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthService } from '../services/authService';

export const moduleRoutes = (modules: ModuleService, auth: AuthService) => {
  const router = Router();

    router.post(
        '/',
        requireAuth(auth),
        requireRole('ADMIN'),
        asyncHandler(async (req, res) => {
        const module = await modules.createModule(req.body);
        res.status(201).json({ module });
        })
    );

    router.get(
        '/',
        requireAuth(auth),
        requireRole('ADMIN'),
        asyncHandler(async (_req, res) => {
        const modulesList = await modules.listModules();
        res.json({ modules: modulesList });
        })
    );

    router.patch(
        '/:id',
        requireAuth(auth),
        requireRole('ADMIN'),
        asyncHandler(async (req, res) => {
            const updatedModule = await modules.editModule(req.params.id!, req.body);
            res.json({ module: updatedModule });
        })
    );

    router.delete(
        '/:id',
        requireAuth(auth),
        requireRole('ADMIN'),
        asyncHandler(async (req, res) => {
        const deletedModule = await modules.deleteModule(req.params.id!);

        res.json({message: 'Module successfully deleted', module: deletedModule,});
        }),
    );

  return router;
};
