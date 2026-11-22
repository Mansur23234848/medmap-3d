import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, CircleSlash, Clock, ExternalLink, Lock, ScanSearch, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge, Card, CardHeader, PageHeader } from '@/components/ui/primitives';
import { api, ApiError } from '@/lib/api';
import type { RxStatus } from '@/lib/types';
import { cn, fmtDate, fmtRelative, RX_STATUS } from '@/lib/utils';

interface LookupResult {
  code: string; status: RxStatus; issuedAt: string; validUntil: string; accessGranted: boolean;
  patientName?: string; patientBirthYear?: number | null; doctorName?: string; doctorSpecialization?: string;
  medication?: { name: string; activeIngredient: string; prescriptionRequired: boolean; sourceUrl: string };
  dosage?: string; frequency?: string; durationDays?: number; instructions?: string | null;
}

export default function PharmacyPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();
  const { data: recent } = useQuery({ queryKey: ['pharmacy', 'recent'], queryFn: () => api.get<{ items: { id: number; at: string; code?: string; found?: boolean }[] }>('/pharmacy/recent') });

  const lookup = async (c: string) => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await api.get<{ prescription: LookupResult }>(`/pharmacy/lookup?code=${encodeURIComponent(c.trim().toUpperCase())}`);
      setResult(r.prescription);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Қате');
    } finally {
      setLoading(false);
      qc.invalidateQueries({ queryKey: ['pharmacy', 'recent'] });
    }
  };
  const submit = (e: FormEvent) => { e.preventDefault(); if (code.trim()) lookup(code); };

  const valid = result && result.status === 'ACTIVE' && new Date(result.validUntil) > new Date();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Дәріхана · демо" title="Тағайындауды тексеру" subtitle="Код бойынша тағайындаудың мәртебесі мен жарамдылығын тексеріңіз. Бұл демонстрациялық модуль — дәрі беру функциясы жоқ." />
      <Card className="p-5">
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <ScanSearch className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted" />
            <input className="field h-13 pl-12 font-mono text-[18px] tracking-[0.12em] uppercase" placeholder="RX-XXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value)} maxLength={12} autoFocus />
          </div>
          <Button type="submit" size="lg" loading={loading} className="h-13">Тексеру</Button>
        </form>
        <p className="mt-3 text-[12px] text-muted">Демо коды: <button onClick={() => { setCode('RX-DEMO-2026'); lookup('RX-DEMO-2026'); }} className="font-mono font-medium text-primary hover:underline">RX-DEMO-2026</button> · рұқсатсыз мысал: <button onClick={() => { setCode('RX-7KQ2-M9PX'); lookup('RX-7KQ2-M9PX'); }} className="font-mono font-medium text-primary hover:underline">RX-7KQ2-M9PX</button></p>
      </Card>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div key="err" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-danger">
            <CircleSlash className="h-5 w-5" /> <p className="text-[14px] font-medium">{error}</p>
          </motion.div>
        )}
        {result && (
          <motion.div key={result.code} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4">
            <Card className="overflow-hidden">
              <div className={cn('flex items-center gap-4 p-5', valid ? 'bg-success-soft' : 'bg-warning-soft')}>
                <div className={cn('grid h-12 w-12 place-items-center rounded-2xl', valid ? 'bg-success text-white' : 'bg-warning text-white')}>
                  {valid ? <BadgeCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                </div>
                <div className="flex-1">
                  <p className="font-mono text-[18px] font-semibold tracking-wider">{result.code}</p>
                  <p className="text-[13px] text-ink-2">{valid ? 'Тағайындау жарамды (демо тексеру)' : 'Тағайындау жарамсыз'}</p>
                </div>
                <Badge tone={RX_STATUS[result.status].tone} dot>{RX_STATUS[result.status].label}</Badge>
              </div>
              <div className="grid gap-4 p-5 text-[13px] sm:grid-cols-2">
                <div><p className="text-[11px] text-muted">Берілген күні</p><p className="font-medium">{fmtDate(result.issuedAt)}</p></div>
                <div><p className="text-[11px] text-muted">Жарамдылық мерзімі</p><p className="flex items-center gap-1.5 font-medium"><Clock className="h-3.5 w-3.5" /> {fmtDate(result.validUntil)} дейін</p></div>
              </div>
              {result.accessGranted ? (
                <div className="border-t border-line p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] text-muted">Дәрігер тағайындаған дәрі</p>
                      <p className="text-[20px] font-semibold tracking-tight">{result.medication?.name}</p>
                      <p className="text-[13px] text-muted">{result.medication?.activeIngredient}</p>
                    </div>
                    <Badge tone={result.medication?.prescriptionRequired ? 'danger' : 'success'}>{result.medication?.prescriptionRequired ? 'Rx' : 'OTC'}</Badge>
                  </div>
                  <div className="mt-4 grid gap-3 text-[13px] sm:grid-cols-3">
                    <div className="rounded-xl bg-surface-2 p-3"><p className="text-[11px] text-muted">Дозасы</p><p className="font-medium">{result.dosage}</p></div>
                    <div className="rounded-xl bg-surface-2 p-3"><p className="text-[11px] text-muted">Жиілігі</p><p className="font-medium">{result.frequency}</p></div>
                    <div className="rounded-xl bg-surface-2 p-3"><p className="text-[11px] text-muted">Ұзақтығы</p><p className="font-medium">{result.durationDays} күн</p></div>
                  </div>
                  {result.instructions && <p className="mt-3 text-[13px] text-ink-2">{result.instructions}</p>}
                  <div className="mt-4 grid gap-2 border-t border-line pt-4 text-[13px] sm:grid-cols-2">
                    <p><span className="text-muted">Пациент:</span> <span className="font-medium">{result.patientName}</span>{result.patientBirthYear ? ` · ${result.patientBirthYear} ж.т.` : ''}</p>
                    <p><span className="text-muted">Дәрігер:</span> <span className="font-medium">{result.doctorName}</span> · {result.doctorSpecialization}</p>
                  </div>
                  <a href={result.medication?.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline">Ресми нұсқаулық <ExternalLink className="h-3 w-3" /></a>
                </div>
              ) : (
                <div className="flex items-center gap-3 border-t border-line p-5 text-[13px] text-muted">
                  <Lock className="h-5 w-5 shrink-0" />
                  Пациент бұл тағайындаудың мазмұнын дәріханаға көрсетуге рұқсат бермеген. Тек мәртебе мен мерзім көрсетіледі.
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="mt-4">
        <CardHeader title="Соңғы тексерулер" subtitle="Әр тексеру аудит журналына жазылады" />
        <div className="divide-y divide-line px-5 pb-3">
          {!recent?.items.length && <p className="py-6 text-center text-[13px] text-muted">Тексерулер жоқ</p>}
          {recent?.items.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2.5 text-[13px]">
              <span className="font-mono">{r.code}</span>
              <span className="flex items-center gap-3"><Badge tone={r.found ? 'success' : 'danger'}>{r.found ? 'Табылды' : 'Табылмады'}</Badge><span className="text-muted">{fmtRelative(r.at)}</span></span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
