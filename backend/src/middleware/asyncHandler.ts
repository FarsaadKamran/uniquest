import { NextFunction, Request, RequestHandler, Response } from 'express';

// Express 4 does not catch rejected promises on its own.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
