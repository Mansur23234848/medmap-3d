import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, FileText, Lock, MousePointerClick, ShieldCheck, Stethoscope } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/layout/AppShell';
import { AREA_NAMES } from '@/components/body3d/areaNames';
import type { RegionSlug } from '@/components/body3d/bodyModel';

const BodyScene = lazy(() => import('@/components/body3d/BodyScene'));

const FEATURES = [
  { icon: <MousePointerClick className="h-5 w-5" />, title: '21 интерактивті аймақ', text: 'Дененің кез келген бөлігін таңдап, белгілерді дәл сол жерге тіркеңіз.' },
  { icon: <Stethoscope className="h-5 w-5" />, title: 'Дәрігермен байланыс', text: 'Рұқсат берген дәрігер шағымдарды көріп, қорытынды жазады.' },
  { icon: <FileText className="h-5 w-5" />, title: 'PDF медициналық есеп', text: 'Барлық жазбаларды бір батырмамен әдемі PDF ретінде жүктеңіз.' },
  { icon: <Lock className="h-5 w-5" />, title: 'Деректер қорғалған', text: 'Рөлдік қолжетімділік, шифрланған құпиясөз, аудит журналы.' },
];

export default function LandingPage() {
  const [sel, setSel] = useState<RegionSlug | null>(null);
  return (
    <div className="min-h-full">
      <header className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className="hidden sm:block"><Button variant="ghost">Кіру</Button></Link>
          <Link to="/register"><Button>Тіркелу</Button></Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 pt-4 pb-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-4 lg:pt-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="order-2 lg:order-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1.5 text-[12px] font-medium text-ink-2 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Цифрлық денсаулық платформасы
          </span>
          <h1 className="mt-6 text-[40px] leading-[1.05] font-semibold tracking-[-0.035em] sm:text-[56px]">
            Денсаулығыңыздың
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">интерактивті 3D картасы</span>
          </h1>
          <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-muted">
            Ауырған жерді 3D денеден көрсетіңіз, белгілерді жеке медициналық картаңызға сақтаңыз және дәрігеріңізбен қауіпсіз бөлісіңіз.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register"><Button size="lg" icon={<ArrowRight className="h-4 w-4" />} className="flex-row-reverse">Бастау</Button></Link>
            <Link to="/login"><Button size="lg" variant="outline">Демо аккаунтпен кіру</Button></Link>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06 }} className="card flex gap-3 p-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">{f.icon}</div>
                <div>
                  <p className="text-[14px] font-semibold">{f.title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-muted">{f.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="mt-8 flex items-start gap-2 text-[12px] text-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            Платформа диагноз қоймайды және дәрі ұсынбайды. Барлық демо деректер синтетикалық.
          </p>
        </motion.div>

        <div className="relative order-1 h-[440px] sm:h-[560px] lg:order-2 lg:h-[680px]">
          <div className="absolute inset-6 rounded-[40px] bg-gradient-to-b from-primary/10 via-accent/5 to-transparent blur-2xl" />
          <Suspense fallback={<div className="skeleton absolute inset-10 rounded-[40px]" />}>
            <BodyScene selected={sel} onSelect={(s) => setSel((p) => (p === s ? null : s))} autoRotate autoFocus={false} />
          </Suspense>
          {sel && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="absolute top-4 right-4 rounded-2xl border border-line bg-surface/85 px-4 py-3 shadow-pop backdrop-blur-xl">
              <p className="eyebrow">Таңдалған аймақ</p>
              <p className="mt-1 text-[15px] font-semibold">{AREA_NAMES[sel].kk}</p>
              <p className="text-[12px] text-muted">Өтінім жіберу үшін жүйеге кіріңіз</p>
            </motion.div>
          )}
        </div>
      </section>

      <footer className="border-t border-line py-6 text-center text-[12px] text-muted">
        © 2026 MEDMAP 3D · Демонстрациялық жоба · 3D модель: Innerscene / MakeHuman (CC0)
      </footer>
    </div>
  );
}
