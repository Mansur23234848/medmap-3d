import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, MailWarning, Plug, Send, Server, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge, Card, CardHeader, EmptyState, Field, PageHeader, Skeleton, Stat } from '@/components/ui/primitives';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { fmtDate } from '@/lib/utils';

interface EmailStatus {
  configured: boolean; host: string; port: number; user: string | null; from: string | null; adminNotify: string | null; devFallback: boolean;
  counts: Partial<Record<'SENT' | 'FAILED' | 'SKIPPED', number>>;
  logs: { id: number; toAddress: string; subject: string; template: string; status: 'SENT' | 'FAILED' | 'SKIPPED'; error: string | null; createdAt: string }[];
}

const TEMPLATE_KK: Record<string, string> = {
  verify_code: 'Растау коды', reset_password: 'Құпиясөзді қалпына келтіру', application_received: 'Өтінім қабылданды',
  admin_new_application: 'Әкімшіге: жаңа өтінім', status_changed: 'Мәртебе өзгерді', doctor_response: 'Дәрігер жауабы', test: 'Тесттік хат',
};
const STATUS_TONE = { SENT: 'success', FAILED: 'danger', SKIPPED: 'warning' } as const;
const STATUS_KK = { SENT: 'Жіберілді', FAILED: 'Қате', SKIPPED: 'Жіберілмеді (SMTP жоқ)' } as const;

export default function AdminEmail() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [to, setTo] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'email'], queryFn: () => api.get<EmailStatus>('/admin/email/status'), refetchInterval: 15_000 });
  const verify = useMutation({
    mutationFn: () => api.post<{ ok: boolean; error?: string }>('/admin/email/verify'),
    onSuccess: (r) => (r.ok ? toast.success('SMTP байланысы сәтті: Gmail серверіне қосылды') : toast.error(r.error ?? 'SMTP байланысы жоқ')),
  });
  const test = useMutation({
    mutationFn: () => api.post<{ status: string; error: string | null }>('/admin/email/test', { to }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['admin', 'email'] });
      if (r.status === 'SENT') toast.success(`Тесттік хат жіберілді: ${to}`);
      else toast.error(r.error ?? 'Хат жіберілмеді');
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading || !data) return <Skeleton className="h-96" />;
  return (
    <div>
      <PageHeader eyebrow="Email жүйесі" title="Email және Gmail SMTP" subtitle="Хат жіберу қызметінің жағдайы, тесттік хат және жіберілген хаттар журналы" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Email қызметі" value={data.configured ? 'Қосулы' : 'Бапталмаған'} hint={data.configured ? 'SMTP параметрлері .env ішінде' : 'server/.env → SMTP_USER, SMTP_PASS'} icon={data.configured ? <CheckCircle2 className="h-4 w-4" /> : <MailWarning className="h-4 w-4" />} tone={data.configured ? 'success' : 'warning'} />
        <Stat label="Жіберілді" value={data.counts.SENT ?? 0} icon={<Send className="h-4 w-4" />} tone="success" />
        <Stat label="Қателер" value={data.counts.FAILED ?? 0} icon={<XCircle className="h-4 w-4" />} tone="danger" />
        <Stat label="Жіберілмеді (SMTP жоқ)" value={data.counts.SKIPPED ?? 0} icon={<MailWarning className="h-4 w-4" />} tone="warning" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="SMTP баптауы" icon={<Server className="h-4 w-4" />} />
          <div className="space-y-2.5 px-5 pb-5 text-[13px]">
            {[
              ['Сервер', `${data.host}:${data.port}`],
              ['Аккаунт', data.user ?? '—'],
              ['Жіберуші', data.from ?? '—'],
              ['Әкімшіге хабарлама', data.adminNotify ?? '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3"><span className="text-muted">{k}</span><span className="truncate font-medium">{v}</span></div>
            ))}
            <p className="pt-1 text-[12px] text-muted">Құпиясөз (App Password) қауіпсіздік үшін көрсетілмейді.</p>
            {data.devFallback && <p className="rounded-xl bg-warning-soft p-3 text-[12px] text-ink-2">SMTP бапталмағандықтан демо режим қосулы: растау коды мен қалпына келтіру сілтемесі тікелей экранда көрсетіледі.</p>}
            <Button variant="outline" className="w-full" icon={<Plug className="h-4 w-4" />} loading={verify.isPending} onClick={() => verify.mutate()}>SMTP байланысын тексеру</Button>
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Тесттік хат жіберу" icon={<Send className="h-4 w-4" />} />
          <form onSubmit={(e) => { e.preventDefault(); test.mutate(); }} className="flex flex-col gap-3 px-5 pb-5 sm:flex-row sm:items-end">
            <Field label="Алушының email мекенжайы" className="flex-1"><input className="field" type="email" required placeholder={user?.email} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
            <Button type="submit" loading={test.isPending} disabled={!to}>Жіберу</Button>
          </form>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Соңғы хаттар журналы" subtitle="Соңғы 40 хат" />
        {data.logs.length === 0 && <EmptyState icon={<Send className="h-5 w-5" />} title="Хаттар әлі жіберілмеген" />}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead><tr className="text-left text-[11px] tracking-wide text-muted uppercase"><th className="px-4 py-3 font-medium">Уақыт</th><th className="px-4 py-3 font-medium">Алушы</th><th className="px-4 py-3 font-medium">Түрі</th><th className="px-4 py-3 font-medium">Тақырып</th><th className="px-4 py-3 font-medium">Мәртебе</th></tr></thead>
            <tbody className="divide-y divide-line">
              {data.logs.map((l) => (
                <tr key={l.id} className="align-top hover:bg-surface-2/50">
                  <td className="px-4 py-2.5 text-[12px] whitespace-nowrap text-muted">{fmtDate(l.createdAt, true)}</td>
                  <td className="px-4 py-2.5">{l.toAddress}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{TEMPLATE_KK[l.template] ?? l.template}</td>
                  <td className="max-w-xs px-4 py-2.5"><p className="truncate text-muted">{l.subject}</p>{l.error && <p className="mt-0.5 text-[11px] text-danger">{l.error}</p>}</td>
                  <td className="px-4 py-2.5"><Badge tone={STATUS_TONE[l.status]}>{STATUS_KK[l.status]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
