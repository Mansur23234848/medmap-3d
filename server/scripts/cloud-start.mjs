/**
 * Start command for cloud hosting (Render). Normalises a hosted MySQL URL (e.g. Aiven's
 * "?ssl-mode=REQUIRED") into Prisma's TLS parameters, applies migrations, seeds an empty
 * database with the demo data, then starts the API + web server.
 */
import { spawnSync } from 'node:child_process';

// Pasted values often carry spaces, line breaks or quotes — strip them.
let url = (process.env.DATABASE_URL ?? '').replace(/\s+/g, '').replace(/^['"]+|['"]+$/g, '');
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}
// If extra text was pasted around the URI, keep just the mysql://… part.
const found = url.match(/mysql:\/\/[^\s'"]+/i);
if (!found) {
  // Never print any part of the value: it may contain secrets.
  console.error(`DATABASE_URL does not contain a mysql:// URI (length ${url.length}). Paste the "Service URI" from Aiven (copy icon).`);
  process.exit(1);
}
url = found[0];
if (/CLICK_TO:?REVEAL_PASSWORD/i.test(url)) {
  // Aiven shows/copies a placeholder until the password is revealed: accept the password separately.
  const pw = (process.env.DB_PASSWORD ?? '').trim();
  if (!pw) {
    console.error('DATABASE_URL contains the Aiven placeholder instead of the real password. Either reveal the password in Aiven before copying, or add DB_PASSWORD with the password.');
    process.exit(1);
  }
  // Aiven's placeholder stands for "user:password" (user is avnadmin unless DB_USER says otherwise).
  const user = (process.env.DB_USER ?? 'avnadmin').trim();
  url = url.replace(/CLICK_TO:?REVEAL_PASSWORD/i, `${encodeURIComponent(user)}:${encodeURIComponent(pw)}`);
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
