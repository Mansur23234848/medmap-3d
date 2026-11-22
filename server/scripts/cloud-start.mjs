/**
 * Start command for cloud hosting (Render). Normalises a hosted MySQL URL (e.g. Aiven's
 * "?ssl-mode=REQUIRED") into Prisma's TLS parameters, applies migrations, seeds an empty
 * database with the demo data, then starts the API + web server.
 */
import { spawnSync } from 'node:child_process';

// Pasted values often carry spaces, line breaks or quotes — strip them.
let url = (process.env.DATABASE_URL ?? '').trim().replace(/^['"]+|['"]+$/g, '').trim();
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}
if (!/^mysql:\/\//i.test(url)) {
  // Diagnostics without leaking the secret: only the scheme part and the length.
  const scheme = url.includes('://') ? url.slice(0, url.indexOf('://')) : '(no "://" found)';
  console.error(`DATABASE_URL must start with mysql:// — got scheme "${scheme.slice(0, 20)}", length ${url.length}. Paste the "Service URI" from Aiven (copy icon).`);
  process.exit(1);
}
if (/CLICK_TO|REVEAL_PASSWORD/i.test(url)) {
  console.error('DATABASE_URL contains the Aiven placeholder instead of the real password. Use the copy icon next to "Service URI" in Aiven.');
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
