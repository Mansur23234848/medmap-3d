import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { CalendarClock, Copy, ExternalLink, KeyRound, Pill, ShieldCheck, ShieldOff, Stethoscope, Store, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar, Badge, Card, CardHeader, EmptyState, Field, PageHeader, Skeleton, stagger } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { cn, fmtDate, RX_STATUS, toInputDate } from '@/lib/utils';
import { ConfirmModal, usePatientRecord } from '../common/shared';

// ======================= Prescriptions =======================
export function PrescriptionsPage() {
  const { data, isLoading } = usePatientRecord();
  const qc = useQueryClient();
  const toggle = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => api.patch(`/patient/prescriptions/${id}/pharmacy-access`, { enabled }),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['patient'] }); toast.success(v.enabled ? 'Дәріханаға көрсетуге рұқсат берілді' : 'Дәріхана рұқсаты алынды'); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Дәрігер тағайындаулары" title="Тағайындаулар" subtitle="Тек дәрігер енгізген тағайындаулар. Дәріхана кодты тек сіз рұқсат берсеңіз тексере алады." />
      {isLoading && <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-60" />)}</div>}
      {!isLoading && !data?.prescriptions.length && <Card><EmptyState icon={<Pill className="h-5 w-5" />} title="Тағайындаулар жоқ" text="Дәрігер тағайындау жасағанда осы жерде пайда болады." /></Card>}
      <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2">
        {data?.prescriptions.map((rx) => {
          const st = RX_STATUS[rx.status];
          const active = rx.status === 'ACTIVE';
          return (
            <motion.div key={rx.id} variants={stagger.item}>
              <Card className="overflow-hidden">
                <div className="flex items-start justify-between gap-3 p-5">
                  <div>
                    <p className="text-[18px] font-semibold tracking-tight">{rx.medication.name}</p>
                    <p className="text-[13px] text-muted">{rx.medication.activeIngredient} · {rx.medication.drugClass}</p>
                  </div>
                  <Badge tone={st.tone} dot>{st.label}</Badge>
                </div>
                <div className="mx-5 flex items-center justify-between rounded-xl border border-dashed border-line-strong bg-surface-2/60 px-4 py-3">
                  <div>
                    <p className="text-[11px] text-muted">Тағайындау коды</p>
                    <p className="font-mono text-[18px] font-semibold tracking-wider">{rx.code}</p>
                  </div>
                  <button onClick={() => { navigator.clipboard?.writeText(rx.code); toast.success('Код көшірілді'); }} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface hover:text-ink" aria-label="Көшіру"><Copy className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3 p-5 text-[13px]">
                  <div><p className="text-[11px] text-muted">Дозасы</p><p className="font-medium">{rx.dosage}</p></div>
                  <div><p className="text-[11px] text-muted">Жиілігі</p><p className="font-medium">{rx.frequency}</p></div>
                  <div><p className="text-[11px] text-muted">Ұзақтығы</p><p className="font-medium">{rx.durationDays} күн</p></div>
                  <div><p className="text-[11px] text-muted">Жарамды</p><p className="font-medium">{fmtDate(rx.validUntil)} дейін</p></div>
                  {rx.instructions && <p className="col-span-2 rounded-xl bg-surface-2 p-3 text-ink-2">{rx.instructions}</p>}
                  <p className="col-span-2 flex items-center gap-1.5 text-[12px] text-muted"><Stethoscope className="h-3.5 w-3.5" /> {rx.doctor.user.fullName} · {fmtDate(rx.issuedAt)}</p>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-2/40 px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Store className={cn('h-4 w-4', rx.pharmacyAccess ? 'text-success' : 'text-muted')} />
                    <div>
                      <p className="text-[13px] font-medium">Дәріханаға көрсету</p>
                      <p className="text-[11px] text-muted">{rx.pharmacyAccess ? 'Дәріхана кодпен тексере алады' : 'Рұқсат берілмеген'}</p>
                    </div>
                  </div>
                  <button
                    role="switch"
                    aria-checked={rx.pharmacyAccess}
                    disabled={!active || toggle.isPending}
                    onClick={() => toggle.mutate({ id: rx.id, enabled: !rx.pharmacyAccess })}
                    className={cn('relative h-7 w-12 rounded-full transition disabled:opacity-40', rx.pharmacyAccess ? 'bg-success' : 'bg-surface-3')}
                  >
                    <motion.span layout className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow', rx.pharmacyAccess ? 'right-1' : 'left-1')} />
                  </button>
                </div>
                <a href={rx.medication.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 border-t border-line px-5 py-3 text-[12px] font-medium text-primary hover:underline">
                  Ресми нұсқаулық: {rx.medication.sourceName} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

// ======================= Access / consents =======================
interface Consent { id: number; status: 'ACTIVE' | 'REVOKED'; grantedAt: string; revokedAt: string | null; expiresAt: string | null; grantee: { id: number; fullName: string; role: string; doctorProfile: { specialization: string; clinic: string | null } | null } }
interface DoctorDir { id: number; specialization: string; clinic: string | null; yearsExperience: number | null; user: { id: number; fullName: string } }

export function AccessPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['patient', 'consents'], queryFn: () => api.get<{ consents: Consent[] }>('/patient/consents') });
  const { data: dir } = useQuery({ queryKey: ['patient', 'doctors'], queryFn: () => api.get<{ doctors: DoctorDir[] }>('/patient/doctors') });
  const [open, setOpen] = useState(false);
  const [doctorUserId, setDoctorUserId] = useState('');
  const [days, setDays] = useState('');
  const [revoking, setRevoking] = useState<Consent | null>(null);

  const grant = useMutation({
    mutationFn: () => api.post('/patient/consents', { doctorUserId: Number(doctorUserId), expiresInDays: days ? Number(days) : null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patient'] }); toast.success('Рұқсат берілді'); setOpen(false); setDoctorUserId(''); setDays(''); },
    onError: (e) => toast.error(e.message),
  });
  const revoke = useMutation({
    mutationFn: (id: number) => api.del(`/patient/consents/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patient'] }); toast.success('Рұқсат кері алынды'); setRevoking(null); },
    onError: (e) => toast.error(e.message),
  });
  const activeIds = new Set(data?.consents.filter((c) => c.status === 'ACTIVE').map((c) => c.grantee.id));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Пациент рұқсаты" title="Деректерге қолжетімділік" subtitle="Медициналық картаңызды қай дәрігер көре алатынын тек сіз шешесіз." actions={<Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setOpen(true)}>Дәрігерге рұқсат беру</Button>} />
      <div className="mb-5 flex gap-3 rounded-2xl border border-primary/20 bg-primary-soft/50 p-4 text-[13px] text-ink-2">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p>Рұқсат берілген дәрігер шағымдарыңызды, 3D картадағы аймақтарды және тарихыңызды көріп, қорытынды мен тағайындау енгізе алады. Рұқсатты кез келген уақытта кері ала аласыз — әр әрекет аудит журналына жазылады.</p>
      </div>
      <Card>
        {isLoading && <div className="space-y-3 p-5">{[0, 1].map((i) => <Skeleton key={i} className="h-16" />)}</div>}
        {!isLoading && !data?.consents.length && <EmptyState icon={<ShieldOff className="h-5 w-5" />} title="Рұқсаттар жоқ" text="Әзірге ешбір дәрігер деректеріңізді көре алмайды." />}
        <div className="divide-y divide-line">
          {data?.consents.map((c) => (
            <div key={c.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={c.grantee.fullName} size={42} />
                <div>
                  <p className="text-[14px] font-semibold">{c.grantee.fullName}</p>
                  <p className="text-[12px] text-muted">{c.grantee.doctorProfile?.specialization} · {c.grantee.doctorProfile?.clinic}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted"><CalendarClock className="h-3 w-3" /> {fmtDate(c.grantedAt)}{c.expiresAt ? ` — ${fmtDate(c.expiresAt)} дейін` : ' · мерзімсіз'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={c.status === 'ACTIVE' ? 'success' : 'neutral'} dot>{c.status === 'ACTIVE' ? 'Белсенді' : 'Кері алынған'}</Badge>
                {c.status === 'ACTIVE' && <Button size="sm" variant="outline" onClick={() => setRevoking(c)}>Кері алу</Button>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Дәрігерге рұқсат беру" subtitle="Таңдалған дәрігер медициналық картаңызды көре алады." footer={<><Button variant="outline" onClick={() => setOpen(false)}>Бас тарту</Button><Button disabled={!doctorUserId} loading={grant.isPending} onClick={() => grant.mutate()}>Рұқсат беру</Button></>}>
        <div className="space-y-2">
          {dir?.doctors.map((d) => {
            const has = activeIds.has(d.user.id);
            return (
              <button key={d.id} disabled={has} onClick={() => setDoctorUserId(String(d.user.id))} className={cn('flex w-full items-center gap-3 rounded-xl border p-3 text-left transition disabled:opacity-50', doctorUserId === String(d.user.id) ? 'border-primary bg-primary-soft' : 'border-line hover:bg-surface-2')}>
                <Avatar name={d.user.fullName} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium">{d.user.fullName}</p>
                  <p className="text-[12px] text-muted">{d.specialization} · {d.clinic}{d.yearsExperience ? ` · ${d.yearsExperience} жыл` : ''}</p>
                </div>
                {has && <Badge tone="success">Рұқсат бар</Badge>}
              </button>
            );
          })}
        </div>
        <Field label="Мерзімі" className="mt-4">
          <select className="field" value={days} onChange={(e) => setDays(e.target.value)}>
            <option value="">Мерзімсіз (кері алғанша)</option>
            <option value="7">7 күн</option>
            <option value="30">30 күн</option>
            <option value="90">90 күн</option>
          </select>
        </Field>
      </Modal>
      <ConfirmModal open={!!revoking} onClose={() => setRevoking(null)} onConfirm={() => revoking && revoke.mutate(revoking.id)} loading={revoke.isPending} title="Рұқсатты кері алу" confirmLabel="Кері алу" text={`${revoking?.grantee.fullName} бұдан былай медициналық картаңызды көре алмайды.`} />
    </div>
  );
}

// ======================= Profile =======================
export function ProfilePage() {
  const { user, refresh } = useAuth();
  const { data } = usePatientRecord();
  const qc = useQueryClient();
  const [f, setF] = useState<Record<string, string>>({});
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });

  useEffect(() => {
    if (!data) return;
    const p = data.profile;
    setF({
      fullName: user?.fullName ?? '', dateOfBirth: p.dateOfBirth ? toInputDate(p.dateOfBirth) : '', gender: p.gender ?? '', phone: p.phone ?? '', bloodType: p.bloodType ?? '',
      heightCm: p.heightCm?.toString() ?? '', weightKg: p.weightKg ?? '', allergies: p.allergies ?? '', chronicConditions: p.chronicConditions ?? '', emergencyContact: p.emergencyContact ?? '',
    });
  }, [data, user]);

  const save = useMutation({
    mutationFn: () => api.put('/patient/profile', {
      ...f,
      dateOfBirth: f.dateOfBirth || null, gender: f.gender || null, bloodType: f.bloodType || null,
      heightCm: f.heightCm ? Number(f.heightCm) : null, weightKg: f.weightKg ? Number(f.weightKg) : null,
    }),
    onSuccess: async () => { await refresh(); qc.invalidateQueries({ queryKey: ['patient'] }); toast.success('Профиль сақталды'); },
    onError: (e) => toast.error(e.message),
  });
  const changePw = useMutation({
    mutationFn: () => api.post('/auth/change-password', pw),
    onSuccess: () => { toast.success('Құпиясөз өзгертілді'); setPw({ currentPassword: '', newPassword: '' }); },
    onError: (e) => toast.error(e.message),
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const submit = (e: FormEvent) => { e.preventDefault(); save.mutate(); };

  if (!data) return <Skeleton className="h-96" />;
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow={`Пациент коды · ${data.profile.patientCode}`} title="Профиль" subtitle={user?.email} />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader title="Жеке және медициналық деректер" />
          <form onSubmit={submit} className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
            <Field label="Аты-жөні" className="sm:col-span-2"><input className="field" value={f.fullName ?? ''} onChange={set('fullName')} required minLength={3} /></Field>
            <Field label="Туған күні"><input className="field" type="date" max={toInputDate(new Date())} value={f.dateOfBirth ?? ''} onChange={set('dateOfBirth')} /></Field>
            <Field label="Жынысы"><select className="field" value={f.gender ?? ''} onChange={set('gender')}><option value="">—</option><option value="FEMALE">Әйел</option><option value="MALE">Ер</option><option value="OTHER">Басқа</option></select></Field>
            <Field label="Телефон"><input className="field" value={f.phone ?? ''} onChange={set('phone')} placeholder="+7 ..." /></Field>
            <Field label="Қан тобы"><select className="field" value={f.bloodType ?? ''} onChange={set('bloodType')}><option value="">—</option>{['O(I)+', 'O(I)-', 'A(II)+', 'A(II)-', 'B(III)+', 'B(III)-', 'AB(IV)+', 'AB(IV)-'].map((b) => <option key={b}>{b}</option>)}</select></Field>
            <Field label="Бойы (см)"><input className="field" type="number" min={40} max={250} value={f.heightCm ?? ''} onChange={set('heightCm')} /></Field>
            <Field label="Салмағы (кг)"><input className="field" type="number" step="0.1" min={2} max={400} value={f.weightKg ?? ''} onChange={set('weightKg')} /></Field>
            <Field label="Аллергиялар" className="sm:col-span-2"><textarea className="field min-h-20" value={f.allergies ?? ''} onChange={set('allergies')} maxLength={1000} /></Field>
            <Field label="Созылмалы аурулар" className="sm:col-span-2"><textarea className="field min-h-20" value={f.chronicConditions ?? ''} onChange={set('chronicConditions')} maxLength={1000} /></Field>
            <Field label="Төтенше байланыс" className="sm:col-span-2"><input className="field" value={f.emergencyContact ?? ''} onChange={set('emergencyContact')} maxLength={160} /></Field>
            <div className="sm:col-span-2 flex justify-end"><Button type="submit" loading={save.isPending}>Сақтау</Button></div>
          </form>
        </Card>
        <Card className="h-fit">
          <CardHeader title="Құпиясөзді өзгерту" icon={<KeyRound className="h-4 w-4" />} />
          <form onSubmit={(e) => { e.preventDefault(); changePw.mutate(); }} className="space-y-3 px-5 pb-5">
            <Field label="Ағымдағы құпиясөз"><input className="field" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw((s) => ({ ...s, currentPassword: e.target.value }))} required /></Field>
            <Field label="Жаңа құпиясөз" hint="Кемінде 8 таңба, әріп пен сан"><input className="field" type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw((s) => ({ ...s, newPassword: e.target.value }))} required minLength={8} /></Field>
            <Button type="submit" variant="outline" className="w-full" loading={changePw.isPending}>Өзгерту</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
