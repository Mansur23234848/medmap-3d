import { lazy, Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ClipboardPlus, Info, MapPin, X, History } from 'lucide-react';
import { AREA_NAMES, isRegionSlug } from '@/components/body3d/areaNames';
import { REGION_SLUGS, type RegionSlug } from '@/components/body3d/bodyModel';
import { Button } from '@/components/ui/Button';
import { Badge, EmptyState, Skeleton } from '@/components/ui/primitives';
import { api } from '@/lib/api';
import type { SymptomReport } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ConfirmModal, ReportCard, SymptomFormModal, useBodyAreas, usePatientRecord } from '../common/shared';

const BodyScene = lazy(() => import('@/components/body3d/BodyScene'));

const SIDE_KK = { LEFT: 'Сол жақ', RIGHT: 'Оң жақ', CENTER: 'Орталық' } as const;
const VIEW_KK = { FRONT: 'Алдыңғы бет', BACK: 'Артқы бет', BOTH: 'Алды және арты' } as const;

export default function BodyMapPage() {
  const [params, setParams] = useSearchParams();
  const selected = isRegionSlug(params.get('area')) ? (params.get('area') as RegionSlug) : null;
  const setSelected = (s: RegionSlug | null) => setParams(s ? { area: s } : {}, { replace: true });
  const { data, isLoading } = usePatientRecord();
  const { data: areas } = useBodyAreas();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SymptomReport | null>(null);
  const [deleting, setDeleting] = useState<SymptomReport | null>(null);
  const qc = useQueryClient();

  const marked = useMemo(() => [...new Set((data?.reports ?? []).map((r) => r.bodyArea.slug))], [data]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    data?.reports.forEach((r) => m.set(r.bodyArea.slug, (m.get(r.bodyArea.slug) ?? 0) + 1));
    return m;
  }, [data]);
  const area = areas?.find((a) => a.slug === selected);
  const areaReports = data?.reports.filter((r) => r.bodyArea.slug === selected) ?? [];

  const del = useMutation({
    mutationFn: (id: number) => api.del(`/patient/reports/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient'] });
      toast.success('Жазба өшірілді');
      setDeleting(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const panel = (
    <AnimatePresence mode="wait">
      {selected && area ? (
        <motion.div key={selected} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.25 }} className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-line p-5">
            <div>
              <p className="eyebrow flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-danger" /> Таңдалған аймақ</p>
              <h2 className="mt-2 text-[22px] font-semibold tracking-tight">{area.nameKk}</h2>
              <p className="text-[13px] text-muted">Адам денесінің аймағы</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge>{SIDE_KK[area.side]}</Badge>
                <Badge>{VIEW_KK[area.view]}</Badge>
                <Badge tone={areaReports.length ? 'danger' : 'neutral'}>{areaReports.length} жазба</Badge>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-ink" aria-label="Таңдауды алып тастау"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold"><Info className="h-4 w-4 text-primary" /> Анатомиялық сипаттама</p>
              <p className="text-[13px] leading-relaxed text-muted">{area.description}</p>
            </div>
            <Button className="w-full" icon={<ClipboardPlus className="h-4 w-4" />} onClick={() => { setEditing(null); setFormOpen(true); }}>Өтінім жіберу</Button>
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold"><History className="h-4 w-4 text-primary" /> Осы аймақтың тарихы</p>
              {areaReports.length === 0 ? (
                <p className="rounded-xl bg-surface-2 px-4 py-6 text-center text-[13px] text-muted">Бұл аймақ бойынша жазба әлі жоқ.</p>
              ) : (
                <div className="space-y-3">
                  {areaReports.map((r) => (
                    <ReportCard
                      key={r.id}
                      report={r}
                      compact
                      records={data?.records.filter((m) => m.symptomReport?.id === r.id)}
                      onEdit={() => { setEditing(r); setFormOpen(true); }}
                      onDelete={() => setDeleting(r)}
                    />
                  ))}
                </div>
              )}
            </div>
            <p className="rounded-xl border border-line bg-surface-2/60 p-3 text-[12px] leading-relaxed text-muted">
              Аймақты таңдау диагноз болып саналмайды. Платформа ауруды анықтамайды және дәрі ұсынбайды — қорытындыны тек дәрігер береді.
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full flex-col p-5">
          <p className="eyebrow">3D дене картасы</p>
          <h2 className="mt-2 text-[20px] font-semibold tracking-tight">Аймақты таңдаңыз</h2>
          <p className="mt-1 text-[13px] text-muted">Денені тышқанмен айналдырып, мазалайтын жерді басыңыз немесе тізімнен таңдаңыз.</p>
          {marked.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[12px] font-semibold text-ink-2">Белгіленген аймақтар</p>
              <div className="flex flex-wrap gap-1.5">
                {marked.map((s) => (
                  <button key={s} onClick={() => setSelected(s as RegionSlug)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-danger-soft px-3 text-[12px] font-medium text-danger transition hover:brightness-95">
                    <MapPin className="h-3.5 w-3.5" /> {AREA_NAMES[s as RegionSlug].kk} · {counts.get(s)}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
            <p className="mb-2 text-[12px] font-semibold text-ink-2">Барлық аймақтар</p>
            <div className="grid grid-cols-2 gap-1.5">
              {REGION_SLUGS.map((s) => (
                <button key={s} onClick={() => setSelected(s)} className="flex h-9 items-center justify-between rounded-lg px-2.5 text-left text-[13px] text-ink-2 transition hover:bg-surface-2 hover:text-ink">
                  <span className="truncate">{AREA_NAMES[s].kk}</span>
                  {counts.get(s) ? <span className="h-1.5 w-1.5 rounded-full bg-danger" /> : null}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="-mx-4 -mt-6 sm:-mx-6 lg:mx-0 lg:mt-0">
      <div className="grid gap-5 lg:h-[calc(100dvh-7.5rem)] lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="relative h-[62dvh] overflow-hidden border-line lg:h-full lg:rounded-3xl lg:border lg:bg-surface/40">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
          {isLoading ? <Skeleton className="absolute inset-10" /> : (
            <Suspense fallback={<Skeleton className="absolute inset-10" />}>
              <BodyScene selected={selected} onSelect={(s) => setSelected(s === selected ? null : s)} marked={marked} />
            </Suspense>
          )}
          <div className="pointer-events-none absolute top-4 right-4 hidden items-center gap-3 rounded-xl border border-line bg-surface/80 px-3 py-2 text-[11px] text-muted backdrop-blur sm:flex">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger" /> Таңдалған</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-300" /> Жазбасы бар</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-400" /> Курсор</span>
          </div>
        </div>

        {/* Desktop info panel */}
        <aside className="card hidden overflow-hidden lg:block">{panel}</aside>

        {/* Mobile panel: bottom sheet when an area is selected, inline list otherwise */}
        <div className={cn('px-4 sm:px-6 lg:hidden', selected && 'hidden')}>
          <div className="card overflow-hidden">{!selected && panel}</div>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-x-0 bottom-0 z-40 max-h-[48dvh] overflow-hidden rounded-t-3xl border-t border-line bg-surface shadow-pop lg:hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => info.offset.y > 120 && setSelected(null)}
          >
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line-strong" />
            <div className="max-h-[calc(48dvh-14px)] overflow-y-auto pb-24">{panel}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <SymptomFormModal open={formOpen} onClose={() => setFormOpen(false)} areaSlug={selected} report={editing} />
      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleting && del.mutate(deleting.id)} loading={del.isPending} title="Жазбаны өшіру" text="Бұл шағым медициналық картаңыздан біржола өшіріледі. Жалғастырасыз ба?" />
    </div>
  );
}
