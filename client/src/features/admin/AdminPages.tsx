import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, ClipboardList, FileText, KeyRound, Pencil, Pill, Plus, ScrollText, Search, ShieldCheck, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar, Badge, Card, CardHeader, EmptyState, Field, PageHeader, Skeleton, Stat, stagger } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import type { Medication, ReportStatus, Role } from '@/lib/types';
import { cn, fmtDate, fmtRelative, REPORT_STATUS, ROLE_LABEL, toInputDate } from '@/lib/utils';
import { ConfirmModal } from '../common/shared';

const tooltipStyle = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12, color: 'var(--text)' };

// ======================= Overview =======================
interface Stats {
  usersByRole: Partial<Record<Role, number>>;
  reportsByStatus: Partial<Record<ReportStatus, number>>;
  prescriptionsByStatus: Record<string, number>;
  reportsByArea: { slug: string; name: string; count: number }[];
  reportsPerDay: { date: string; reports: number }[];
  loginsLast7d: number; medicalRecords: number; medications: number; activeConsents: number; activityLogs: number;
}

export function AdminOverview() {
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'stats'], queryFn: () => api.get<Stats>('/admin/stats') });
  if (isLoading || !data) return <div className="grid gap-4 sm:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;
  const users = Object.values(data.usersByRole).reduce((a, b) => a + (b ?? 0), 0);
  const reports = Object.values(data.reportsByStatus).reduce((a, b) => a + (b ?? 0), 0);
  const statusData = (Object.keys(REPORT_STATUS) as ReportStatus[]).map((k) => ({ name: REPORT_STATUS[k].label, value: data.reportsByStatus[k] ?? 0 }));
  const COLORS = ['var(--primary)', 'var(--warning)', 'var(--success)', 'var(--muted)'];

  return (
    <div>
      <PageHeader eyebrow="System statistics" title="Жүйе шолуы" subtitle="Барлық көрсеткіштер деректер базасынан нақты уақытта есептеледі" />
      <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <motion.div variants={stagger.item}><Stat label="Қолданушылар" value={users} hint={`${data.usersByRole.PATIENT ?? 0} пациент · ${data.usersByRole.DOCTOR ?? 0} дәрігер · ${data.usersByRole.PHARMACIST ?? 0} фармацевт`} icon={<Users className="h-4 w-4" />} /></motion.div>
        <motion.div variants={stagger.item}><Stat label="Шағымдар" value={reports} hint={`${data.medicalRecords} дәрігер қорытындысы`} icon={<ClipboardList className="h-4 w-4" />} tone="warning" /></motion.div>
        <motion.div variants={stagger.item}><Stat label="Белсенді рұқсаттар" value={data.activeConsents} hint="Пациент → дәрігер" icon={<ShieldCheck className="h-4 w-4" />} tone="success" /></motion.div>
        <motion.div variants={stagger.item}><Stat label="Кірулер (7 күн)" value={data.loginsLast7d} hint={`${data.activityLogs} аудит жазбасы`} icon={<Activity className="h-4 w-4" />} tone="accent" /></motion.div>
      </motion.div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Шағымдар динамикасы" subtitle="Соңғы 14 күн" />
          <div className="h-64 px-3 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.reportsPerDay.map((d) => ({ ...d, label: d.date.slice(5) }))} margin={{ left: -24, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--surface-2)' }} formatter={(v: number) => [v, 'Шағым']} />
                <Bar dataKey="reports" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Шағым мәртебелері" />
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={3} stroke="none">
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 px-5 pb-5 text-[12px]">
            {statusData.map((s, i) => <span key={s.name} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[i] }} />{s.name}: <b>{s.value}</b></span>)}
          </div>
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader title="Дене аймақтары бойынша шағымдар" />
        <div className="space-y-2.5 px-5 pb-5">
          {data.reportsByArea.length === 0 && <p className="text-[13px] text-muted">Дерек жоқ</p>}
          {data.reportsByArea.map((a) => (
            <div key={a.slug} className="flex items-center gap-3 text-[13px]">
              <span className="w-44 shrink-0 truncate">{a.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(a.count / data.reportsByArea[0].count) * 100}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-gradient-to-r from-primary to-accent" />
              </div>
              <span className="w-6 text-right font-medium tabular-nums">{a.count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ======================= Users / doctors / patients / pharmacies =======================
interface AdminUser {
  id: number; email: string; fullName: string; role: Role; isActive: boolean; lastLoginAt: string | null; createdAt: string;
  patientProfile: { id: number; patientCode: string; _count: { symptomReports: number } } | null;
  doctorProfile: { id: number; specialization: string; licenseNumber: string; clinic: string | null } | null;
  pharmacyProfile: { id: number; pharmacyName: string; licenseNumber: string; address: string | null } | null;
}

const ROLE_TABS: [Role | '', string][] = [['', 'Барлығы'], ['PATIENT', 'Пациенттер'], ['DOCTOR', 'Дәрігерлер'], ['PHARMACIST', 'Дәріханалар'], ['ADMIN', 'Әкімшілер']];

export function AdminUsers() {
  const qc = useQueryClient();
  const [role, setRole] = useState<Role | ''>('');
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'users', role, q], queryFn: () => api.get<{ users: AdminUser[] }>(`/admin/users?role=${role}&q=${encodeURIComponent(q)}`) });
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<AdminUser | null>(null);

  const toggleActive = useMutation({
    mutationFn: (u: AdminUser) => api.patch(`/admin/users/${u.id}`, { isActive: !u.isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); toast.success('Сақталды'); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader eyebrow="Users management" title="Қолданушылар" subtitle="Рөлдерді, профильдерді және аккаунт мәртебесін басқару" actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>Қолданушы қосу</Button>} />
      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1">
            {ROLE_TABS.map(([k, l]) => <button key={k} onClick={() => setRole(k)} className={cn('h-9 shrink-0 rounded-lg px-3 text-[13px] font-medium', role === k ? 'bg-surface shadow-card' : 'text-muted hover:text-ink')}>{l}</button>)}
          </div>
          <div className="relative lg:w-72"><Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" /><input className="field h-10 pl-9" placeholder="Іздеу" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        </div>
        {isLoading && <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>}
        {!isLoading && !data?.users.length && <EmptyState icon={<Users className="h-5 w-5" />} title="Қолданушылар табылмады" />}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead><tr className="text-left text-[11px] tracking-wide text-muted uppercase"><th className="px-4 py-3 font-medium">Қолданушы</th><th className="px-4 py-3 font-medium">Рөл</th><th className="px-4 py-3 font-medium">Профиль</th><th className="px-4 py-3 font-medium">Соңғы кіру</th><th className="px-4 py-3 font-medium">Мәртебе</th><th className="px-4 py-3" /></tr></thead>
            <tbody className="divide-y divide-line">
              {data?.users.map((u) => (
                <tr key={u.id} className="transition hover:bg-surface-2/50">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar name={u.fullName} size={34} /><div><p className="font-medium">{u.fullName}</p><p className="text-[12px] text-muted">{u.email}</p></div></div></td>
                  <td className="px-4 py-3"><Badge tone={u.role === 'ADMIN' ? 'danger' : u.role === 'DOCTOR' ? 'primary' : u.role === 'PHARMACIST' ? 'accent' : 'neutral'}>{ROLE_LABEL[u.role]}</Badge></td>
                  <td className="px-4 py-3 text-[12px] text-muted">
                    {u.patientProfile && <>{u.patientProfile.patientCode} · {u.patientProfile._count.symptomReports} шағым</>}
                    {u.doctorProfile && <>{u.doctorProfile.specialization} · {u.doctorProfile.licenseNumber}</>}
                    {u.pharmacyProfile && <>{u.pharmacyProfile.pharmacyName} · {u.pharmacyProfile.licenseNumber}</>}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted">{u.lastLoginAt ? fmtRelative(u.lastLoginAt) : '—'}</td>
                  <td className="px-4 py-3"><button onClick={() => toggleActive.mutate(u)}><Badge tone={u.isActive ? 'success' : 'danger'} dot>{u.isActive ? 'Белсенді' : 'Бұғатталған'}</Badge></button></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setResetting(u)} title="Құпиясөзді қалпына келтіру" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"><KeyRound className="h-4 w-4" /></button>
                      <button onClick={() => setEditing(u)} title="Өзгерту" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"><Pencil className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <UserModal open={creating || !!editing} user={editing} onClose={() => { setCreating(false); setEditing(null); }} />
      <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} />
    </div>
  );
}

function UserModal({ open, user, onClose }: { open: boolean; user: AdminUser | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState<Record<string, string>>({});
  const [key, setKey] = useState<string>('');
  const k = `${open}-${user?.id ?? 'new'}`;
  if (k !== key) {
    setKey(k);
    setF({ fullName: user?.fullName ?? '', email: user?.email ?? '', password: '', role: user?.role ?? 'PATIENT', specialization: user?.doctorProfile?.specialization ?? '', licenseNumber: user?.doctorProfile?.licenseNumber ?? user?.pharmacyProfile?.licenseNumber ?? '', clinic: user?.doctorProfile?.clinic ?? '', pharmacyName: user?.pharmacyProfile?.pharmacyName ?? '', address: user?.pharmacyProfile?.address ?? '' });
  }
  const save = useMutation({
    mutationFn: () => {
      const clean = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''));
      return user ? api.patch(`/admin/users/${user.id}`, { ...clean, email: undefined, password: undefined }) : api.post('/admin/users', clean);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); toast.success(user ? 'Қолданушы жаңартылды' : 'Қолданушы қосылды'); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const set = (n: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((s) => ({ ...s, [n]: e.target.value }));
  const needsDoctor = f.role === 'DOCTOR' && !user?.doctorProfile;
  const needsPharm = f.role === 'PHARMACIST' && !user?.pharmacyProfile;
  return (
    <Modal open={open} onClose={onClose} title={user ? 'Қолданушыны өзгерту' : 'Жаңа қолданушы'} subtitle="Рөл өзгергенде қажетті профиль автоматты жасалады." footer={<><Button variant="outline" onClick={onClose}>Бас тарту</Button><Button loading={save.isPending} onClick={() => save.mutate()}>Сақтау</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Аты-жөні" className="sm:col-span-2"><input className="field" value={f.fullName ?? ''} onChange={set('fullName')} /></Field>
        {!user && <><Field label="Email"><input className="field" type="email" value={f.email ?? ''} onChange={set('email')} /></Field><Field label="Құпиясөз"><input className="field" type="password" autoComplete="new-password" value={f.password ?? ''} onChange={set('password')} /></Field></>}
        <Field label="Рөл" className="sm:col-span-2"><select className="field" value={f.role} onChange={set('role')}>{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></Field>
        {needsDoctor && <><Field label="Мамандығы"><input className="field" value={f.specialization ?? ''} onChange={set('specialization')} /></Field><Field label="Лицензия нөмірі"><input className="field" value={f.licenseNumber ?? ''} onChange={set('licenseNumber')} /></Field><Field label="Клиника" className="sm:col-span-2"><input className="field" value={f.clinic ?? ''} onChange={set('clinic')} /></Field></>}
        {needsPharm && <><Field label="Дәріхана атауы"><input className="field" value={f.pharmacyName ?? ''} onChange={set('pharmacyName')} /></Field><Field label="Лицензия нөмірі"><input className="field" value={f.licenseNumber ?? ''} onChange={set('licenseNumber')} /></Field><Field label="Мекенжай" className="sm:col-span-2"><input className="field" value={f.address ?? ''} onChange={set('address')} /></Field></>}
      </div>
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
  const [pw, setPw] = useState('');
  const save = useMutation({
    mutationFn: () => api.post(`/admin/users/${user!.id}/reset-password`, { password: pw }),
    onSuccess: () => { toast.success('Құпиясөз жаңартылды'); setPw(''); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Modal open={!!user} onClose={onClose} size="sm" title="Құпиясөзді қалпына келтіру" subtitle={user?.email} footer={<><Button variant="outline" onClick={onClose}>Бас тарту</Button><Button disabled={pw.length < 8} loading={save.isPending} onClick={() => save.mutate()}>Сақтау</Button></>}>
      <Field label="Жаңа құпиясөз" hint="Кемінде 8 таңба"><input className="field" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
    </Modal>
  );
}

// ======================= Medical records management =======================
interface AdminRecords {
  reports: { id: number; createdAt: string; status: ReportStatus; intensity: number; description: string; bodyArea: { nameKk: string }; patient: { patientCode: string; user: { fullName: string } }; _count: { attachments: number; medicalRecords: number } }[];
  records: { id: number; createdAt: string; title: string; recordType: string; patient: { patientCode: string; user: { fullName: string } }; doctor: { user: { fullName: string } } }[];
}

export function AdminRecords() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'records'], queryFn: () => api.get<AdminRecords>('/admin/records') });
  const [del, setDel] = useState<number | null>(null);
  const remove = useMutation({
    mutationFn: (id: number) => api.del(`/admin/reports/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); toast.success('Шағым өшірілді'); setDel(null); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div>
      <PageHeader eyebrow="Medical records management" title="Медициналық жазбалар" subtitle="Барлық шағымдар мен дәрігер қорытындылары (әкімші көрінісі аудитке жазылады)" />
      <Card>
        <CardHeader title={`Шағымдар (${data?.reports.length ?? 0})`} icon={<ClipboardList className="h-4 w-4" />} />
        {isLoading && <Skeleton className="m-4 h-40" />}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead><tr className="text-left text-[11px] tracking-wide text-muted uppercase"><th className="px-4 py-3 font-medium">Пациент</th><th className="px-4 py-3 font-medium">Аймақ</th><th className="px-4 py-3 font-medium">Сипаттама</th><th className="px-4 py-3 font-medium">Мәртебе</th><th className="px-4 py-3 font-medium">Күні</th><th /></tr></thead>
            <tbody className="divide-y divide-line">
              {data?.reports.map((r) => (
                <tr key={r.id} className="hover:bg-surface-2/50">
                  <td className="px-4 py-3"><p className="font-medium">{r.patient.user.fullName}</p><p className="font-mono text-[11px] text-muted">{r.patient.patientCode}</p></td>
                  <td className="px-4 py-3">{r.bodyArea.nameKk}</td>
                  <td className="max-w-xs px-4 py-3"><p className="truncate text-muted">{r.description}</p></td>
                  <td className="px-4 py-3"><Badge tone={REPORT_STATUS[r.status].tone}>{REPORT_STATUS[r.status].label}</Badge></td>
                  <td className="px-4 py-3 text-[12px] text-muted">{fmtDate(r.createdAt)}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => setDel(r.id)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="mt-4">
        <CardHeader title={`Дәрігер қорытындылары (${data?.records.length ?? 0})`} icon={<FileText className="h-4 w-4" />} />
        <div className="divide-y divide-line">
          {data?.records.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-[13px]">
              <div><p className="font-medium">{m.title}</p><p className="text-[12px] text-muted">{m.patient.user.fullName} · {m.doctor.user.fullName}</p></div>
              <span className="text-[12px] text-muted">{fmtDate(m.createdAt)}</span>
            </div>
          ))}
        </div>
      </Card>
      <ConfirmModal open={del !== null} onClose={() => setDel(null)} onConfirm={() => del && remove.mutate(del)} loading={remove.isPending} title="Шағымды өшіру" text="Шағым және оған тіркелген файлдар біржола өшіріледі." />
    </div>
  );
}

// ======================= Medication database management =======================
export function AdminMedications() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'medications'], queryFn: () => api.get<{ medications: Medication[] }>('/admin/medications') });
  const [editing, setEditing] = useState<Medication | 'new' | null>(null);
  const [del, setDel] = useState<Medication | null>(null);
  const remove = useMutation({
    mutationFn: (id: number) => api.del<{ archived: boolean }>(`/admin/medications/${id}`),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['admin'] }); qc.invalidateQueries({ queryKey: ['medications'] }); toast.success(r.archived ? 'Тағайындаулары бар болғандықтан мұрағатталды' : 'Өшірілді'); setDel(null); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div>
      <PageHeader eyebrow="Medication database management" title="Дәрілер базасы" subtitle="Әр жазбаға ресми дереккөз сілтемесі міндетті" actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing('new')}>Дәрі қосу</Button>} />
      <Card>
        {isLoading && <Skeleton className="m-4 h-40" />}
        <div className="divide-y divide-line">
          {data?.medications.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary"><Pill className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold">{m.name} <Badge tone={m.prescriptionRequired ? 'danger' : 'success'}>{m.prescriptionRequired ? 'Rx' : 'OTC'}</Badge>{!m.isActive && <Badge>Мұрағатта</Badge>}</p>
                <p className="text-[12px] text-muted">{m.activeIngredient} · {m.sourceName} · {m._count?.prescriptions ?? 0} тағайындау</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(m)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setDel(m)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <MedicationModal med={editing} onClose={() => setEditing(null)} />
      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={() => del && remove.mutate(del.id)} loading={remove.isPending} title="Дәріні өшіру" text="Егер дәрі тағайындауларда қолданылса, ол өшірілмей мұрағатқа жіберіледі." />
    </div>
  );
}

function MedicationModal({ med, onClose }: { med: Medication | 'new' | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState<Record<string, string | boolean>>({});
  const [key, setKey] = useState('');
  const k = med === null ? 'closed' : med === 'new' ? 'new' : String(med.id);
  if (k !== key) {
    setKey(k);
    const m = med && med !== 'new' ? med : null;
    setF({ name: m?.name ?? '', activeIngredient: m?.activeIngredient ?? '', drugClass: m?.drugClass ?? '', dosageForms: m?.dosageForms ?? '', indications: m?.indications ?? '', contraindications: m?.contraindications ?? '', prescriptionRequired: m?.prescriptionRequired ?? true, availabilityNote: m?.availabilityNote ?? '', sourceName: m?.sourceName ?? '', sourceUrl: m?.sourceUrl ?? '', sourceCheckedAt: toInputDate(m?.sourceCheckedAt ?? new Date()), isActive: m?.isActive ?? true });
  }
  const save = useMutation({
    mutationFn: () => (med && med !== 'new' ? api.put(`/admin/medications/${med.id}`, f) : api.post('/admin/medications', f)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); qc.invalidateQueries({ queryKey: ['medications'] }); toast.success('Сақталды'); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const set = (n: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [n]: e.target.value }));
  return (
    <Modal open={med !== null} onClose={onClose} size="lg" title={med === 'new' ? 'Жаңа дәрі' : 'Дәріні өзгерту'} subtitle="Ақпаратты тек ресми дереккөзден (NHS, EMA, FDA, ҚР дәрілер тізілімі т.б.) толтырыңыз." footer={<><Button variant="outline" onClick={onClose}>Бас тарту</Button><Button loading={save.isPending} onClick={() => save.mutate()}>Сақтау</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Атауы"><input className="field" value={String(f.name ?? '')} onChange={set('name')} /></Field>
        <Field label="Белсенді заты"><input className="field" value={String(f.activeIngredient ?? '')} onChange={set('activeIngredient')} /></Field>
        <Field label="Фармакологиялық тобы"><input className="field" value={String(f.drugClass ?? '')} onChange={set('drugClass')} /></Field>
        <Field label="Шығарылу түрлері"><input className="field" value={String(f.dosageForms ?? '')} onChange={set('dosageForms')} /></Field>
        <Field label="Қолданылуы (ресми)" className="sm:col-span-2"><textarea className="field" value={String(f.indications ?? '')} onChange={set('indications')} /></Field>
        <Field label="Қарсы көрсетілімдер (ресми)" className="sm:col-span-2"><textarea className="field min-h-28" value={String(f.contraindications ?? '')} onChange={set('contraindications')} /></Field>
        <Field label="Дереккөз атауы"><input className="field" value={String(f.sourceName ?? '')} onChange={set('sourceName')} /></Field>
        <Field label="Дереккөз сілтемесі (https)"><input className="field" value={String(f.sourceUrl ?? '')} onChange={set('sourceUrl')} /></Field>
        <Field label="Тексерілген күні"><input className="field" type="date" value={String(f.sourceCheckedAt ?? '')} onChange={set('sourceCheckedAt')} /></Field>
        <Field label="Қолжетімділік ескертпесі"><input className="field" value={String(f.availabilityNote ?? '')} onChange={set('availabilityNote')} /></Field>
        <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={!!f.prescriptionRequired} onChange={(e) => setF((s) => ({ ...s, prescriptionRequired: e.target.checked }))} className="h-4 w-4 accent-[var(--primary)]" /> Рецеппен беріледі (Rx)</label>
        <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={!!f.isActive} onChange={(e) => setF((s) => ({ ...s, isActive: e.target.checked }))} className="h-4 w-4 accent-[var(--primary)]" /> Белсенді</label>
      </div>
    </Modal>
  );
}

// ======================= Activity logs =======================
interface Log { id: number; action: string; entityType: string | null; entityId: string | null; ipAddress: string | null; createdAt: string; metadata: unknown; user: { fullName: string; role: Role } | null }

export function AdminLogs() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'logs', page, action], queryFn: () => api.get<{ items: Log[]; total: number; pages: number }>(`/admin/logs?page=${page}&action=${action}`) });
  const FILTERS = [['', 'Барлығы'], ['auth', 'Кіру'], ['report', 'Шағымдар'], ['consent', 'Рұқсаттар'], ['prescription', 'Тағайындаулар'], ['pharmacy', 'Дәріхана'], ['admin', 'Әкімші'], ['pdf', 'PDF'], ['doctor', 'Дәрігер']];
  return (
    <div>
      <PageHeader eyebrow="Audit logs" title="Аудит журналы" subtitle={`Барлығы ${data?.total ?? 0} жазба`} />
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1">
        {FILTERS.map(([k, l]) => <button key={k} onClick={() => { setAction(k); setPage(1); }} className={cn('h-9 shrink-0 rounded-lg px-3 text-[13px] font-medium', action === k ? 'bg-surface shadow-card' : 'text-muted hover:text-ink')}>{l}</button>)}
      </div>
      <Card>
        {isLoading && <Skeleton className="m-4 h-60" />}
        {!isLoading && !data?.items.length && <EmptyState icon={<ScrollText className="h-5 w-5" />} title="Жазбалар жоқ" />}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead><tr className="text-left text-[11px] tracking-wide text-muted uppercase"><th className="px-4 py-3 font-medium">Уақыт</th><th className="px-4 py-3 font-medium">Қолданушы</th><th className="px-4 py-3 font-medium">Әрекет</th><th className="px-4 py-3 font-medium">Нысан</th><th className="px-4 py-3 font-medium">IP</th></tr></thead>
            <tbody className="divide-y divide-line">
              {data?.items.map((l) => (
                <tr key={l.id} className="hover:bg-surface-2/50">
                  <td className="px-4 py-2.5 text-[12px] whitespace-nowrap text-muted">{fmtDate(l.createdAt, true)}</td>
                  <td className="px-4 py-2.5">{l.user ? <>{l.user.fullName} <span className="text-[11px] text-muted">· {ROLE_LABEL[l.user.role]}</span></> : <span className="text-muted">—</span>}</td>
                  <td className="px-4 py-2.5"><code className={cn('rounded-md px-1.5 py-0.5 text-[12px]', l.action.includes('failed') ? 'bg-danger-soft text-danger' : 'bg-surface-2')}>{l.action}</code></td>
                  <td className="px-4 py-2.5 text-[12px] text-muted">{l.entityType ? `${l.entityType}#${l.entityId ?? ''}` : '—'}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-muted">{l.ipAddress ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-[13px]">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Алдыңғы</Button>
            <span className="text-muted">{page} / {data.pages}</span>
            <Button size="sm" variant="outline" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Келесі</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
