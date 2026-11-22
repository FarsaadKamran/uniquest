/**
 * DEMO DATA for the leaderboard (so you can see the page working).
 *   npx tsx scripts/seedLeaderboard.ts          -> create 12 demo students + random xp events
 *   npx tsx scripts/seedLeaderboard.ts --clean  -> delete them again
 * Demo logins: demo1@mumail.ie ... demo12@mumail.ie, password "demopassword1"
 * Run from the backend/ folder. Do NOT run against a real/production database.
 */
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NAMES = [
  'Aoife Byrne', 'Cian Murphy', 'Saoirse Kelly', 'Oisín Walsh', 'Niamh Doyle', 'Conor Ryan',
  'Ciara Brennan', 'Darragh Quinn', 'Éabha Nolan', 'Fionn Gallagher', 'Grace Daly', 'Luke Farrell',
];

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000 - rand(0, 3_000_000));

async function main() {
  const demoEmails = NAMES.map((_, i) => `demo${i + 1}@mumail.ie`);

  if (process.argv.includes('--clean')) {
    const { count } = await prisma.user.deleteMany({ where: { email: { in: demoEmails } } }); // xp events cascade
    console.log(`Deleted ${count} demo students.`);
    return;
  }

  const passwordHash = await bcrypt.hash('demopassword1', 10);

  for (const [i, fullName] of NAMES.entries()) {
    const email = demoEmails[i]!;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, fullName, displayName: fullName, passwordHash, role: 'STUDENT' },
    });

    await prisma.xpEvent.deleteMany({ where: { userId: user.id } });

    // some events today, some this week, some older (up to ~1 year back)
    const events = [
      ...Array.from({ length: rand(0, 2) }, () => ({ at: daysAgo(0), amount: rand(10, 60) })),
      ...Array.from({ length: rand(1, 4) }, () => ({ at: daysAgo(rand(0, 6)), amount: rand(20, 120) })),
      ...Array.from({ length: rand(2, 6) }, () => ({ at: daysAgo(rand(7, 40)), amount: rand(20, 150) })),
      ...Array.from({ length: rand(2, 8) }, () => ({ at: daysAgo(rand(41, 360)), amount: rand(20, 200) })),
    ];

    await prisma.xpEvent.createMany({
      data: events.map((e) => ({ userId: user.id, amount: e.amount, reason: 'Demo data', createdAt: e.at })),
    });
    // all-time total = sum of the events (so all-time is always >= week/month/year)
    await prisma.user.update({
      where: { id: user.id },
      data: { xp: events.reduce((sum, e) => sum + e.amount, 0) },
    });
  }
  console.log(`Seeded ${NAMES.length} demo students. Log in as demo1@mumail.ie / demopassword1`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
