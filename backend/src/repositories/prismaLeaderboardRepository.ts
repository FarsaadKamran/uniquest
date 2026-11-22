import type { PrismaClient } from '@prisma/client';
import { AppError } from '../errors';
import { Role, XpTotal } from '../types';
import { LeaderboardRepository } from './leaderboardRepository';

export class PrismaLeaderboardRepository implements LeaderboardRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getTotals(roles: readonly Role[], since: Date | null): Promise<XpTotal[]> {
    // ALL TIME: User.xp already holds the running total
    if (since === null) {
      const users = await this.prisma.user.findMany({
        where: { role: { in: [...roles] }, xp: { gt: 0 } },
        select: { id: true, displayName: true, xp: true },
      });
      return users.map((u) => ({ userId: u.id, displayName: u.displayName, xp: u.xp }));
    }

    // TODAY / WEEK / MONTH / YEAR: add up the xp events inside the period
    const grouped = await this.prisma.xpEvent.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: since }, user: { role: { in: [...roles] } } },
      _sum: { amount: true },
    });

    const totals = grouped
      .map((g) => ({ userId: g.userId, xp: g._sum.amount ?? 0 }))
      .filter((g) => g.xp > 0);
    if (totals.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: totals.map((t) => t.userId) } },
      select: { id: true, displayName: true },
    });
    const names = new Map(users.map((u) => [u.id, u.displayName]));

    return totals.map((t) => ({
      userId: t.userId,
      displayName: names.get(t.userId) ?? 'Unknown',
      xp: t.xp,
    }));
  }

  async awardXp(userId: string, amount: number, reason?: string): Promise<void> {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new AppError(400, 'XP amount must be a positive integer', 'INVALID_XP');
    }
    try {
      // both writes succeed or neither does
      await this.prisma.$transaction([
        this.prisma.user.update({ where: { id: userId }, data: { xp: { increment: amount } } }),
        this.prisma.xpEvent.create({ data: { userId, amount, reason: reason ?? null } }),
      ]);
    } catch (err) {
      if ((err as { code?: string }).code === 'P2025') {
        throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
      }
      throw err;
    }
  }
}
