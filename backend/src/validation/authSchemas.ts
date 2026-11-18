import { z } from 'zod';
import { AppError } from '../errors';

// Admins are never created through public sign-up.
export const SELF_REGISTER_ROLES = ['STUDENT', 'LECTURER', 'COMMITTEE_MEMBER'] as const;

const STUDENT_DOMAIN = '@mumail.ie';
const STAFF_DOMAIN = '@mu.ie';

export const registerSchema = z
  .object({
    accountType: z.enum(SELF_REGISTER_ROLES),
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email().max(254),
    displayName: z.string().trim().min(2).max(30).optional(),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .refine((p) => Buffer.byteLength(p, 'utf8') <= 72, 'Password is too long (bcrypt limit is 72 bytes)'),
  })
  .superRefine((data, ctx) => {
    const requiredDomain = data.accountType === 'LECTURER' ? STAFF_DOMAIN : STUDENT_DOMAIN;
    if (!data.email.endsWith(requiredDomain)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: `Use your ${requiredDomain} email`,
      });
    }

    if (data.accountType !== 'LECTURER' && !data.displayName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['displayName'],
          message: 'Display name is required for the leaderboard',
        });
      }
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.flatten().fieldErrors);
  }
  return result.data;
}
