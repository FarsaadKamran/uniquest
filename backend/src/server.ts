import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createApp } from './app';
import { loadConfig } from './config';
import { PrismaUserRepository } from './repositories/prismaUserRepository';
import { PrismaModuleRepository } from './repositories/prismaModuleRepository';

const config = loadConfig();
const prisma = new PrismaClient();
const app = createApp({ userRepo: new PrismaUserRepository(prisma), moduleRepo: new PrismaModuleRepository(prisma), config });

const port = Number(process.env.PORT ?? 3000);
const server = app.listen(port, () => console.log(`UniQuest API listening on :${port}`));

const shutdown = () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
