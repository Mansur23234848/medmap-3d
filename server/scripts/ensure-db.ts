/**
 * Used by START_MEDMAP.bat: after `prisma migrate deploy`, fills the database with demo data
 * only if it is still empty (never wipes existing data).
 */
import { PrismaClient } from '@prisma/client';
import { execSync } from 'node:child_process';

const prisma = new PrismaClient();
const users = await prisma.user.count().catch(() => -1);
await prisma.$disconnect();
if (users === 0) {
  console.log('[db] Деректер базасы бос — демо деректер енгізілуде…');
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
} else if (users > 0) {
  console.log(`[db] Деректер базасы дайын (${users} қолданушы).`);
} else {
  console.error('[db] Деректер базасына қосылу мүмкін болмады. server/.env ішіндегі DATABASE_URL тексеріңіз.');
  process.exit(1);
}
