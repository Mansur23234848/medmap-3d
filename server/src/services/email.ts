import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { prisma } from '../lib/core.js';

let transporter: Transporter | null = null;
function getTransporter() {
  if (!env.smtp.configured) return null;
  transporter ??= nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    requireTLS: env.smtp.port === 587,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
  return transporter;
}

/** Masks an address for display: "aigerim.s@gmail.com" → "ai*****s@gmail.com". */
export function maskEmail(addr: string) {
  const [u, d] = addr.split('@');
  if (!d) return '***';
  if (u.length <= 2) return `${u[0]}***@${d}`;
  return `${u.slice(0, 2)}${'*'.repeat(Math.max(3, u.length - 3))}${u.slice(-1)}@${d}`;
}

/** Strips anything that looks like a credential from error text before it is stored or shown. */
function safeError(e: unknown) {
  let msg = e instanceof Error ? e.message : String(e);
  if (env.smtp.pass) msg = msg.split(env.smtp.pass).join('***');
  return msg.slice(0, 500);
}

export function emailStatus() {
  return {
    configured: env.smtp.configured,
    host: env.smtp.host,
    port: env.smtp.port,
    user: env.smtp.user ? maskEmail(env.smtp.user) : null,
    from: env.smtp.from ? env.smtp.from.replace(/<([^>]+)>/, (_, a) => `<${maskEmail(a)}>`) : null,
    adminNotify: env.adminNotifyEmail ? maskEmail(env.adminNotifyEmail) : null,
    devFallback: !env.smtp.configured && env.emailDevFallback,
  };
}

export async function verifySmtp(): Promise<{ ok: boolean; error?: string }> {
  const t = getTransporter();
  if (!t) return { ok: false, error: 'SMTP бапталмаған: server/.env ішінде SMTP_USER және SMTP_PASS толтырылмаған' };
  try {
    await t.verify();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: safeError(e) };
  }
}

// ---------- Kazakh e-mail templates in the MEDMAP 3D visual style ----------
function layout(title: string, body: string, cta?: { label: string; url: string }) {
  const button = cta
    ? `<tr><td style="padding:8px 32px 28px"><a href="${cta.url}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:12px">${cta.label}</a></td></tr>`
    : '';
  return `<!doctype html><html lang="kk"><body style="margin:0;background:#f5f7fb;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0b1530">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0">
<tr><td style="background:#0b1530;padding:22px 32px"><span style="display:inline-block;width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#3b82f6,#06b6d4);color:#fff;font-weight:700;text-align:center;line-height:30px;margin-right:10px">+</span><span style="color:#fff;font-weight:700;font-size:16px;vertical-align:middle">MEDMAP <span style="color:#22d3ee">3D</span></span></td></tr>
<tr><td style="padding:28px 32px 8px"><h1 style="margin:0 0 12px;font-size:20px;line-height:1.3">${title}</h1><div style="font-size:14px;line-height:1.6;color:#334155">${body}</div></td></tr>
${button}
<tr><td style="padding:18px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b">Бұл хат MEDMAP 3D демонстрациялық платформасынан автоматты түрде жіберілді. Платформа диагноз қоймайды және дәрі ұсынбайды.</td></tr>
</table></td></tr></table></body></html>`;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const templates = {
  verifyCode: (name: string, code: string) => ({
    subject: `MEDMAP 3D: растау коды ${code}`,
    html: layout('Электрондық поштаңызды растаңыз', `Сәлеметсіз бе, ${esc(name)}!<br/>Тіркелуді аяқтау үшін мына кодты енгізіңіз:<div style="margin:18px 0;font-size:32px;font-weight:700;letter-spacing:8px;color:#2563eb">${code}</div>Код <b>10 минут</b> ішінде жарамды. Егер сіз тіркелмеген болсаңыз, бұл хатты елемеңіз.`),
  }),
  resetPassword: (name: string, url: string) => ({
    subject: 'MEDMAP 3D: құпиясөзді қалпына келтіру',
    html: layout('Құпиясөзді қалпына келтіру', `Сәлеметсіз бе, ${esc(name)}!<br/>Құпиясөзді қалпына келтіру сұралды. Төмендегі батырма арқылы жаңа құпиясөз орнатыңыз. Сілтеме <b>30 минут</b> жарамды және тек <b>бір рет</b> қолданылады.<br/><br/>Егер сіз сұрамаған болсаңыз, бұл хатты елемеңіз — құпиясөзіңіз өзгермейді.`, { label: 'Жаңа құпиясөз орнату', url }),
  }),
  applicationReceived: (name: string, appNo: string, area: string) => ({
    subject: `MEDMAP 3D: өтінім қабылданды (${appNo})`,
    html: layout('Өтініміңіз қабылданды', `Сәлеметсіз бе, ${esc(name)}!<br/>Сіздің <b>${appNo}</b> нөмірлі өтініміңіз жүйеге сақталды.<br/>Дене аймағы: <b>${esc(area)}</b><br/>Мәртебесі: <b>Жаңа өтінім</b><br/><br/>Мәртебе өзгергенде сізге хабарлама жібереміз.`, { label: 'Өтінімдерімді ашу', url: `${env.appUrl}/app/applications` }),
  }),
  adminNewApplication: (appNo: string, patient: string, area: string, description: string) => ({
    subject: `MEDMAP 3D: жаңа өтінім ${appNo}`,
    html: layout('Жаңа өтінім түсті', `Өтінім нөмірі: <b>${appNo}</b><br/>Пациент: <b>${esc(patient)}</b><br/>Дене аймағы: <b>${esc(area)}</b><br/><br/><i>${esc(description.slice(0, 300))}</i>`, { label: 'Админ панелінде ашу', url: `${env.appUrl}/admin/applications` }),
  }),
  statusChanged: (name: string, appNo: string, status: string) => ({
    subject: `MEDMAP 3D: өтінім ${appNo} мәртебесі өзгерді`,
    html: layout('Өтінім мәртебесі өзгерді', `Сәлеметсіз бе, ${esc(name)}!<br/><b>${appNo}</b> нөмірлі өтініміңіздің жаңа мәртебесі: <b>${esc(status)}</b>.`, { label: 'Толығырақ', url: `${env.appUrl}/app/applications` }),
  }),
  doctorResponse: (name: string, appNo: string | null, doctor: string, title: string) => ({
    subject: `MEDMAP 3D: дәрігер жауабы${appNo ? ` (${appNo})` : ''}`,
    html: layout('Дәрігерден жаңа жауап', `Сәлеметсіз бе, ${esc(name)}!<br/>${esc(doctor)} ${appNo ? `<b>${appNo}</b> өтініміңіз бойынша ` : ''}жаңа жазба қалдырды: <b>${esc(title)}</b>.<br/>Толық мәтінді жеке кабинетіңізден оқи аласыз.`, { label: 'Медициналық тарихты ашу', url: `${env.appUrl}/app/history` }),
  }),
  test: () => ({
    subject: 'MEDMAP 3D: тесттік хат',
    html: layout('SMTP байланысы жұмыс істейді ✅', `Бұл MEDMAP 3D админ панелінен жіберілген тесттік хат. Gmail SMTP баптауы дұрыс.`),
  }),
};

/**
 * Sends an e-mail and records the attempt in email_logs. Never throws: callers get a status back,
 * so an e-mail problem can never break registration or application submission.
 */
export async function sendEmail(opts: { to: string; template: string; subject: string; html: string; userId?: number | null }) {
  const t = getTransporter();
  let status: 'SENT' | 'FAILED' | 'SKIPPED' = 'SKIPPED';
  let error: string | null = null;
  if (!t) {
    error = 'SMTP бапталмаған (демо режим)';
  } else {
    try {
      await t.sendMail({ from: env.smtp.from, to: opts.to, subject: opts.subject, html: opts.html });
      status = 'SENT';
    } catch (e) {
      status = 'FAILED';
      error = safeError(e);
      console.error(`[email] ${opts.template} → failed: ${error}`);
    }
  }
  try {
    await prisma.emailLog.create({ data: { toAddress: opts.to.slice(0, 191), subject: opts.subject.slice(0, 255), template: opts.template, status, error, userId: opts.userId ?? null } });
  } catch (e) {
    console.error('[email] log write failed', e);
  }
  return { status, error };
}

/** Fire-and-forget variant for notifications that must not delay the HTTP response. */
export function sendEmailLater(opts: Parameters<typeof sendEmail>[0]) {
  void sendEmail(opts);
}
