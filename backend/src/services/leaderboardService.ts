import { AppError } from '../errors';
import { LeaderboardRepository } from '../repositories/leaderboardRepository';
import {
  AuthContext,
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardResult,
  Role,
  isLeaderboardPeriod,
} from '../types';

// Who appears ON the leaderboard. Lecturers and admins can VIEW it but are not ranked.
export const LEADERBOARD_ROLES: readonly Role[] = ['STUDENT', 'COMMITTEE_MEMBER'];

/**
 * Start of the current period (server's local time), null = all time.
 *  today = since midnight, week = since Monday 00:00,
 *  month = since the 1st, year = since 1 January.
 */
export function periodStart(period: LeaderboardPeriod, now: Date = new Date()): Date | null {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  switch (period) {
    case 'today':
      return new Date(y, m, d);
    case 'week':
      return new Date(y, m, d - ((now.getDay() + 6) % 7)); // getDay(): Sun=0 -> Monday start
    case 'month':
      return new Date(y, m, 1);
    case 'year':
      return new Date(y, 0, 1);
    case 'all':
      return null;
  }
}

export class LeaderboardService {
  constructor(private readonly repo: LeaderboardRepository) {}

  async getLeaderboard(
    periodInput: unknown,
    viewer: AuthContext,
    limit = 50,
    now: Date = new Date(),
  ): Promise<LeaderboardResult> {
    if (!isLeaderboardPeriod(periodInput)) {
      throw new AppError(400, 'period must be today, week, month, year or all', 'INVALID_PERIOD');
    }
    const period = periodInput;
    const since = periodStart(period, now);

    const totals = await this.repo.getTotals(LEADERBOARD_ROLES, since);

    // highest xp first, same xp -> alphabetical so the order is stable
    totals.sort((a, b) => b.xp - a.xp || a.displayName.localeCompare(b.displayName));

    // ties share a rank: 100, 90, 90, 80 -> ranks 1, 2, 2, 4
    const ranked: LeaderboardEntry[] = [];
    totals.forEach((t, i) => {
      const prev = ranked[i - 1];
      ranked.push({ ...t, rank: prev && prev.xp === t.xp ? prev.rank : i + 1 });
    });

    const mine = ranked.find((e) => e.userId === viewer.userId);
    const me = mine
      ? { rank: mine.rank, xp: mine.xp }
      : LEADERBOARD_ROLES.includes(viewer.role)
        ? { rank: null, xp: 0 }
        : null;

    return {
      period,
      since: since ? since.toISOString() : null,
      entries: ranked.slice(0, limit),
      me,
    };
  }
}
