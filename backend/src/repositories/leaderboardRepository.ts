import { Role, XpTotal } from '../types';

export interface LeaderboardRepository {
  /**
   * XP earned per user, only for users with one of `roles` and more than 0 xp.
   * `since` = start of the period, or null for ALL TIME (uses User.xp).
   * Order does not matter, the service sorts and ranks.
   */
  getTotals(roles: readonly Role[], since: Date | null): Promise<XpTotal[]>;

  /**
   * Call this whenever a student earns XP (quest approved, attendance, etc).
   * Adds to User.xp (all time) AND logs an XpEvent (so today/week/month/year work).
   */
  awardXp(userId: string, amount: number, reason?: string): Promise<void>;
}
