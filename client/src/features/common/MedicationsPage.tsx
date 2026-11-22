import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, BookOpen, ExternalLink, Search, ShieldAlert } from 'lucide-react';
import { Badge, Card, EmptyState, PageHeader, Skeleton, stagger } from '@/components/ui/primitives';
import { api } from '@/lib/api';
import type { Medication } from '@/lib/types';
import { fmtDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export default function MedicationsPage() {
  const [q, setQ] = useState('');
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['medications', q], queryFn: () => api.get<{ medications: Medication[] }>(`/medications?q=${encodeURIComponent(q)}`) });
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Дәрілер анықтамалығы" title="Дәрілер анықтамалығы" subtitle="Тек ресми дереккөздерден алынған анықтамалық ақпарат. Әр жазбада түпнұсқа сілтеме бар." />
      <div className="mb-5 flex gap-3 rounded-2xl border border-warning/25 bg-warning-soft p-4 text-[13px] text-ink-2">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <p>Бұл бөлім дәрі таңдауға немесе өз бетінше емделуге арналмаған. Платформа симптомдар бойынша дәрі ұсынбайды. Кез келген дәріні тек дәрігердің тағайындауымен қабылдаңыз.</p>
      </div>
      <div className="relative mb-5">
        <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
        <input className="field pl-10" placeholder="Атауы, белсенді заты немесе тобы бойынша іздеу" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {isLoading && <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44" />)}</div>}
      {!isLoading && !data?.medications.length && <Card><EmptyState icon={<BookOpen className="h-5 w-5" />} title="Ештеңе табылмады" /></Card>}
      <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2">
        {data?.medications.map((m) => (
          <motion.div key={m.id} variants={stagger.item}>
            <Card className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[17px] font-semibold tracking-tight">{m.name}</p>
                  <p className="text-[13px] text-muted">Белсенді заты: <span className="font-medium text-ink-2">{m.activeIngredient}</span></p>
                </div>
                <Badge tone={m.prescriptionRequired ? 'danger' : 'success'}>{m.prescriptionRequired ? 'Rx · рецеппен' : 'OTC · рецептсіз'}</Badge>
              </div>
              {m.drugClass && <p className="mt-2 text-[12px] text-muted">{m.drugClass}</p>}
              <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{m.indications}</p>
              {open === m.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-3 overflow-hidden">
                  <div className="rounded-xl bg-danger-soft/60 p-3">
                    <p className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold text-danger"><ShieldAlert className="h-3.5 w-3.5" /> Қарсы көрсетілімдер мен сақтық</p>
                    <p className="whitespace-pre-line text-[12px] leading-relaxed text-ink-2">{m.contraindications}</p>
                  </div>
                  {m.dosageForms && <p className="text-[12px] text-muted"><span className="font-medium text-ink-2">Шығарылу түрлері:</span> {m.dosageForms}</p>}
                  {m.availabilityNote && <p className="text-[12px] text-muted"><span className="font-medium text-ink-2">Қолжетімділік:</span> {m.availabilityNote}</p>}
                </motion.div>
              )}
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 mt-4">
                <button onClick={() => setOpen(open === m.id ? null : m.id)} className="text-[12px] font-medium text-primary hover:underline">{open === m.id ? 'Жасыру' : 'Толығырақ'}</button>
                {user?.role === 'DOCTOR' && <Badge tone="primary">Менің тағайындауларым: {m.myPrescriptions ?? 0}</Badge>}
                <a href={m.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[12px] text-muted hover:text-primary">{m.sourceName} · {fmtDate(m.sourceCheckedAt)} <ExternalLink className="h-3 w-3" /></a>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
