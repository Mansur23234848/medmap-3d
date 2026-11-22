import { lazy, Suspense, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowUpRight, Bell, ClipboardList, Download, FileHeart, MessageSquareText, Pill, Stethoscope, UserRound, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge, Card, CardHeader, EmptyState, PageHeader, Skeleton, Stat, stagger } from '@/components/ui/primitives';
import { openPdf } from '@/lib/api';
import { fmtDate, fmtRelative, GENDER, RX_STATUS } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { ReportCard, usePatientRecord } from '../common/shared';

const BodyScene = lazy(() => import('@/components/body3d/BodyScene'));

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = usePatientRecord();
  const [pdfLoading, setPdfLoading] = useState(false);

  const marked = useMemo(() => [...new Set((data?.reports ?? []).map((r) => r.bodyArea.slug))], [data]);
  const areaStats = useMemo(() => {
    const m = new Map<string, { name: string; count: number }>();
    data?.reports.forEach((r) => {
      const x = m.get(r.bodyArea.slug) ?? { name: r.bodyArea.nameKk, count: 0 };
      x.count++;
      m.set(r.bodyArea.slug, x);
    });
    return [...m.entries()].sort((a, b) => b[1].count - a[1].count);
  }, [data]);
  const chart = useMemo(
    () => [...(data?.reports ?? [])].reverse().map((r) => ({ date: fmtDate(r.createdAt).slice(0, 6), intensity: r.intensity, area: r.bodyArea.nameKk })),
    [data],
  );

  const pdf = async () => {
    setPdfLoading(true);
    try {
      await openPdf('/patient/pdf');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPdfLoading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-80" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const p = data.profile;
  const open = data.reports.filter((r) => r.status === 'NEW' || r.status === 'UNDER_REVIEW' || r.status === 'ACCEPTED').length;
  const activeRx = data.prescriptions.filter((r) => r.status === 'ACTIVE');
  const firstName = user?.fullName.split(' ')[0];

  return (
    <div>
      <PageHeader
        eyebrow={fmtDate(new Date())}
        title={<>Сәлеметсіз бе, {firstName} 👋</>}
        subtitle="Медициналық картаңыздың қысқаша шолуы"
        actions={
          <>
            <Link to="/app/body-map"><Button variant="outline" icon={<Activity className="h-4 w-4" />}>Шағым қосу</Button></Link>
            <Button icon={<Download className="h-4 w-4" />} loading={pdfLoading} onClick={pdf}>PDF есеп</Button>
          </>
        }
      />

      <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <motion.div variants={stagger.item}><Stat label="Барлық шағымдар" value={data.reports.length} hint={`${areaStats.length} дене аймағы`} icon={<ClipboardList className="h-4 w-4" />} /></motion.div>
        <motion.div variants={stagger.item}><Stat label="Қаралуды күтуде" value={open} hint="Ашық және қаралудағы" icon={<Activity className="h-4 w-4" />} tone="warning" /></motion.div>
        <motion.div variants={stagger.item}><Stat label="Дәрігер қорытындылары" value={data.records.length} hint={`${data.notes.length} дәрігер жазбасы`} icon={<Stethoscope className="h-4 w-4" />} tone="success" /></motion.div>
        <motion.div variants={stagger.item}><Stat label="Белсенді тағайындаулар" value={activeRx.length} hint={`Барлығы ${data.prescriptions.length}`} icon={<Pill className="h-4 w-4" />} tone="accent" /></motion.div>
      </motion.div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {/* Profile */}
        <Card>
          <CardHeader title="Пациент профилі" icon={<UserRound className="h-4 w-4" />} action={<Link to="/app/profile" className="text-[12px] font-medium text-primary hover:underline">Өзгерту</Link>} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 pb-5 text-[13px]">
            {[
              ['Пациент коды', p.patientCode],
              ['Жасы', p.age != null ? `${p.age} жас` : '—'],
              ['Жынысы', p.gender ? GENDER[p.gender] : '—'],
              ['Қан тобы', p.bloodType ?? '—'],
              ['Бойы', p.heightCm ? `${p.heightCm} см` : '—'],
              ['Салмағы', p.weightKg ? `${p.weightKg} кг` : '—'],
            ].map(([k, v]) => (
              <div key={k}><p className="text-[11px] text-muted">{k}</p><p className="mt-0.5 font-medium">{v}</p></div>
            ))}
            <div className="col-span-2"><p className="text-[11px] text-muted">Аллергиялар</p><p className="mt-0.5 font-medium">{p.allergies || 'Көрсетілмеген'}</p></div>
            <div className="col-span-2 flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2">
              <span className="text-muted">Рұқсат берілген дәрігерлер</span>
              <Link to="/app/access" className="font-semibold text-primary">{data.activeConsents}</Link>
            </div>
          </div>
        </Card>

        {/* Selected body areas with a live 3D preview */}
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader title="Белгіленген дене аймақтары" subtitle="Шағымдар енгізілген аймақтар 3D модельде белгіленген" icon={<FileHeart className="h-4 w-4" />} action={<Link to="/app/body-map" className="flex items-center gap-1 text-[12px] font-medium text-primary hover:underline">3D карта <ArrowUpRight className="h-3.5 w-3.5" /></Link>} />
          <div className="grid gap-4 px-5 pb-5 sm:grid-cols-[220px_1fr]">
            <div className="relative h-72 overflow-hidden rounded-2xl bg-surface-2/60">
              <Suspense fallback={<Skeleton className="absolute inset-4" />}>
                <BodyScene marked={marked} interactive={false} toolbar={false} autoRotate autoFocus={false} />
              </Suspense>
            </div>
            <div className="space-y-2">
              {areaStats.length === 0 && <EmptyState icon={<FileHeart className="h-5 w-5" />} title="Аймақтар белгіленбеген" text="3D картадан аймақ таңдап, алғашқы шағымыңызды енгізіңіз." />}
              {areaStats.map(([slug, a]) => (
                <Link key={slug} to={`/app/body-map?area=${slug}`} className="flex items-center justify-between rounded-xl border border-line px-3.5 py-2.5 transition hover:border-danger/40 hover:bg-danger-soft/40">
                  <span className="flex items-center gap-2 text-[14px] font-medium"><span className="h-2 w-2 rounded-full bg-danger" />{a.name}</span>
                  <Badge tone="danger">{a.count} жазба</Badge>
                </Link>
              ))}
              {chart.length > 1 && (
                <div className="pt-2">
                  <p className="mb-1 text-[12px] font-medium text-muted">Қарқындылық динамикасы (өз бағаңыз)</p>
                  <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chart} margin={{ top: 6, right: 6, left: -28, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} formatter={(v: number, _n, item) => [`${v}/10`, item.payload.area]} />
                        <Area type="monotone" dataKey="intensity" stroke="var(--primary)" strokeWidth={2} fill="url(#gi)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Соңғы шағымдар" icon={<ClipboardList className="h-4 w-4" />} action={<Link to="/app/history" className="text-[12px] font-medium text-primary hover:underline">Барлық тарих</Link>} />
          <div className="space-y-3 px-5 pb-5">
            {data.reports.length === 0 && <EmptyState icon={<ClipboardList className="h-5 w-5" />} title="Шағымдар жоқ" />}
            {data.reports.slice(0, 3).map((r) => <ReportCard key={r.id} report={r} compact records={data.records.filter((m) => m.symptomReport?.id === r.id)} />)}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Тағайындаулар" icon={<Pill className="h-4 w-4" />} action={<Link to="/app/prescriptions" className="text-[12px] font-medium text-primary hover:underline">Барлығы</Link>} />
            <div className="space-y-2 px-5 pb-5">
              {data.prescriptions.length === 0 && <p className="py-4 text-center text-[13px] text-muted">Тағайындаулар жоқ</p>}
              {data.prescriptions.slice(0, 3).map((rx) => (
                <div key={rx.id} className="rounded-xl border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[14px] font-semibold">{rx.medication.name}</p>
                    <Badge tone={RX_STATUS[rx.status].tone}>{RX_STATUS[rx.status].label}</Badge>
                  </div>
                  <p className="mt-1 text-[12px] text-muted">{rx.dosage} · {rx.frequency}</p>
                  <p className="mt-1 font-mono text-[12px] text-ink-2">{rx.code}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Дәрігер жазбалары" icon={<MessageSquareText className="h-4 w-4" />} />
            <div className="space-y-3 px-5 pb-5">
              {data.notes.length === 0 && <p className="py-4 text-center text-[13px] text-muted">Жазбалар жоқ</p>}
              {data.notes.slice(0, 3).map((n) => (
                <div key={n.id} className="border-l-2 border-primary pl-3">
                  <p className="text-[13px] leading-relaxed">{n.content}</p>
                  <p className="mt-1 text-[11px] text-muted">{n.doctor.user.fullName} · {fmtRelative(n.createdAt)}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Хабарламалар" icon={<Bell className="h-4 w-4" />} />
            <div className="space-y-2.5 px-5 pb-5">
              {data.notifications.length === 0 && <p className="py-4 text-center text-[13px] text-muted">Хабарламалар жоқ</p>}
              {data.notifications.slice(0, 4).map((n) => (
                <div key={n.id} className="flex gap-2.5">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.readAt ? 'bg-line-strong' : 'bg-primary'}`} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium">{n.title}</p>
                    <p className="truncate text-[12px] text-muted">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
