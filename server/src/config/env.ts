import 'dotenv/config';
import path from 'node:path';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env variable: ${name}`);
  return v;
}

const smtpUser = process.env.SMTP_USER?.trim() ?? '';
const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, '') ?? ''; // Google shows App Passwords with spaces

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  /** Browser origins allowed to call the API with cookies (comma separated). */
  clientOrigins: (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173,http://localhost,http://127.0.0.1,http://localhost:4000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  /** Public address of the web app, used in e-mail links. */
  appUrl: (process.env.APP_URL ?? 'http://localhost/medmap3d').replace(/\/+$/, ''),
  uploadDir: path.resolve(process.env.UPLOAD_DIR ?? './uploads'),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_MB ?? 5) * 1024 * 1024,
  isProd: process.env.NODE_ENV === 'production',
  smtp: {
    host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT ?? 587),
    user: smtpUser,
    pass: smtpPass,
    from: process.env.SMTP_FROM?.trim() || (smtpUser ? `MEDMAP 3D <${smtpUser}>` : ''),
    configured: !!(smtpUser && smtpPass),
  },
  adminNotifyEmail: process.env.ADMIN_NOTIFY_EMAIL?.trim() || smtpUser,
  /** When SMTP is not configured, show verification codes / reset links on screen (demo mode only). */
  emailDevFallback: (process.env.EMAIL_DEV_FALLBACK ?? 'true') !== 'false',
};

if (env.jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');
