import { AppError } from '../src/errors';
import { LeaderboardRepository } from '../src/repositories/leaderboardRepository';
import { LeaderboardService, periodStart } from '../src/services/leaderboardService';
import { XpTotal } from '../src/types';

// Fake repository: returns whatever totals we give it and remembers what it was asked
class FakeLeaderboardRepo implements LeaderboardRepository {
  lastSince: Date | null | undefined;
  constructor(private totals: XpTotal[]) {}
  async getTotals(_roles: readonly string[], since: Date | null) {
    this.lastSince = since;
    return [...this.totals];
  }
  async awardXp() {}
}

const student = { userId: 'u3', role: 'STUDENT' as const };
const lecturer = { userId: 'l1', role: 'LECTURER' as const };

const totals: XpTotal[] = [
  { userId: 'u1', displayName: 'Cian', xp: 100 },
  { userId: 'u2', displayName: 'Aoife', xp: 300 },
  { userId: 'u3', displayName: 'Niamh', xp: 100 },
  { userId: 'u4', displayName: 'Zara', xp: 50 },
];

describe('periodStart', () => {
  const wednesday = new Date(2026, 10, 18, 15, 30); // Wed 18 Nov 2026

  it('today starts at midnight', () => {
    expect(periodStart('today', wednesday)).toEqual(new Date(2026, 10, 18));
  });
  it('week starts on Monday', () => {
    expect(periodStart('week', wednesday)).toEqual(new Date(2026, 10, 16));
  });
  it('week on a Sunday goes back to the Monday before', () => {
    expect(periodStart('week', new Date(2026, 10, 22, 12))).toEqual(new Date(2026, 10, 16));
  });
  it('month starts on the 1st, year on 1 January', () => {
    expect(periodStart('month', wednesday)).toEqual(new Date(2026, 10, 1));
    expect(periodStart('year', wednesday)).toEqual(new Date(2026, 0, 1));
  });
  it('all time has no start', () => {
    expect(periodStart('all', wednesday)).toBeNull();
  });
});

describe('LeaderboardService', () => {
  it('sorts by xp, ties share a rank and are ordered by name', async () => {
    const result = await new LeaderboardService(new FakeLeaderboardRepo(totals)).getLeaderboard('week', student);
    expect(result.entries.map((e) => [e.displayName, e.rank])).toEqual([
      ['Aoife', 1],
      ['Cian', 2],
      ['Niamh', 2],
      ['Zara', 4],
    ]);
  });

  it('returns the viewer\'s own rank', async () => {
    const result = await new LeaderboardService(new FakeLeaderboardRepo(totals)).getLeaderboard('all', student);
    expect(result.me).toEqual({ rank: 2, xp: 100 });
  });

  it('student with no xp gets rank null, lecturers get me = null but can still view', async () => {
    const service = new LeaderboardService(new FakeLeaderboardRepo(totals));
    expect((await service.getLeaderboard('today', { userId: 'new', role: 'STUDENT' })).me).toEqual({ rank: null, xp: 0 });
    const asLecturer = await service.getLeaderboard('today', lecturer);
    expect(asLecturer.me).toBeNull();
    expect(asLecturer.entries).toHaveLength(4);
  });

  it('respects the limit', async () => {
    const result = await new LeaderboardService(new FakeLeaderboardRepo(totals)).getLeaderboard('week', student, 2);
    expect(result.entries).toHaveLength(2);
  });

  it('passes the period start to the repository', async () => {
    const repo = new FakeLeaderboardRepo([]);
    await new LeaderboardService(repo).getLeaderboard('month', student, 50, new Date(2026, 10, 18));
    expect(repo.lastSince).toEqual(new Date(2026, 10, 1));
    await new LeaderboardService(repo).getLeaderboard('all', student);
    expect(repo.lastSince).toBeNull();
  });

  it('rejects an unknown period', async () => {
    const service = new LeaderboardService(new FakeLeaderboardRepo([]));
    await expect(service.getLeaderboard('decade', student)).rejects.toBeInstanceOf(AppError);
  });
});
