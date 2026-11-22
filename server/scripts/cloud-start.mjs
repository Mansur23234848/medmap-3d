/**
 * Start command for cloud hosting (Render). Normalises a hosted MySQL URL (e.g. Aiven's
 * "?ssl-mode=REQUIRED") into Prisma's TLS parameters, applies migrations, seeds an empty
 * database with the demo data, then starts the API + web server.
 */
import { spawnSync } from 'node:child_process';

let url = process.env.DATABASE_URL ?? '';
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}
url = url.replace(/([?&])ssl-mode=[^&]*/i, '$1sslaccept=accept_invalid_certs').replace(/\?&/, '?');
if (!/sslaccept=/.test(url) && process.env.DB_SSL !== 'false') url += (url.includes('?') ? '&' : '?') + 'sslaccept=accept_invalid_certs';
process.env.DATABASE_URL = url;

const run = (cmd) => {
  const r = spawnSync(cmd, { stdio: 'inherit', shell: true, env: process.env });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
run('npx prisma migrate deploy');
run('npx tsx scripts/ensure-db.ts');
run('npx tsx src/index.ts');
