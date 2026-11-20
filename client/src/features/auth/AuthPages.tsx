import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Eye, EyeOff, Pill, Shield, Stethoscope, User } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/primitives';
import { ThemeToggle } from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { api, ApiError } from '@/lib/api';
import { ROLE_HOME } from '@/lib/utils';

const DEMO = [
  { role: 'Пациент', email: 'patient@medmap.demo', password: 'Patient2026!', icon: <User className="h-4 w-4" /> },
  { role: 'Дәрігер', email: 'doctor@medmap.demo', password: 'Doctor2026!', icon: <Stethoscope className="h-4 w-4" /> },
  { role: 'Фармацевт', email: 'pharmacy@medmap.demo', password: 'Pharma2026!', icon: <Pill className="h-4 w-4" /> },
  { role: 'Әкімші', email: 'admin@medmap.demo', password: 'Admin2026!', icon: <Shield className="h-4 w-4" /> },
];

function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-full lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#060b1a] lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(800px_500px_at_30%_20%,rgba(59,130,246,0.35),transparent_60%),radial-gradient(600px_400px_at_80%_90%,rgba(6,182,212,0.25),transparent_60%)]" />
        <div className="grid-bg absolute inset-0 opacity-30 [--border:rgba(148,163,184,0.08)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link to="/"><Logo /></Link>
          <div>
            <p className="max-w-md text-[34px] leading-tight font-semibold tracking-tight">Медициналық деректеріңіз — бір визуалды картада.</p>
            <p className="mt-4 max-w-md text-[15px] text-slate-400">Пациент, дәрігер және дәріхана арасындағы қауіпсіз, рұқсатқа негізделген цифрлық байланыс.</p>
          </div>
          <p className="text-[12px] text-slate-500">Демонстрациялық платформа · синтетикалық деректер</p>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Link to="/" className="lg:invisible"><Logo /></Link>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="w-full max-w-[420px]">
            <h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-[14px] text-muted">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function PasswordInput({ value, onChange, autoComplete }: { value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input className="field pr-11" type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} required />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label="Құпиясөзді көрсету" className="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-ink">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const me = await login(email, password);
      toast.success(`Қош келдіңіз, ${me.fullName.split(' ')[0]}!`);
      nav(ROLE_HOME[me.role], { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Кіру мүмкін болмады');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Жүйеге кіру" subtitle="Аккаунтыңызға кіріп, медициналық картаңызды ашыңыз.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></Field>
        <Field label="Құпиясөз"><PasswordInput value={password} onChange={setPassword} autoComplete="current-password" /></Field>
        {error && <p className="rounded-xl bg-danger-soft px-3 py-2.5 text-[13px] text-danger">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={loading}>Кіру</Button>
      </form>
      <p className="mt-6 text-center text-[14px] text-muted">Аккаунтыңыз жоқ па? <Link to="/register" className="font-medium text-primary hover:underline">Тіркелу</Link></p>

      <div className="mt-8 rounded-2xl border border-dashed border-line-strong p-4">
        <p className="eyebrow mb-3">Демо аккаунттар — толтыру үшін басыңыз</p>
        <div className="grid grid-cols-2 gap-2">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => {
                setEmail(d.email);
                setPassword(d.password);
              }}
              className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-left text-[13px] font-medium transition hover:border-primary hover:bg-primary-soft"
            >
              <span className="text-primary">{d.icon}</span>
              {d.role}
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const { refresh } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ fullName: '', email: '', password: '', dateOfBirth: '', gender: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agree, setAgree] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!agree) return setError('Демо шарттарымен келісіңіз');
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', { ...f, dateOfBirth: f.dateOfBirth || undefined, gender: f.gender || undefined });
      await refresh();
      toast.success('Аккаунт жасалды');
      nav('/app/body-map', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Тіркелу мүмкін болмады');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Тіркелу" subtitle="Пациент ретінде жеке медициналық картаңызды жасаңыз.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Аты-жөні"><input className="field" value={f.fullName} onChange={(e) => set('fullName')(e.target.value)} autoComplete="name" required minLength={3} /></Field>
        <Field label="Email"><input className="field" type="email" value={f.email} onChange={(e) => set('email')(e.target.value)} autoComplete="email" required /></Field>
        <Field label="Құпиясөз" hint="Кемінде 8 таңба, әріп пен сан"><PasswordInput value={f.password} onChange={set('password')} autoComplete="new-password" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Туған күні"><input className="field" type="date" max={new Date().toISOString().slice(0, 10)} value={f.dateOfBirth} onChange={(e) => set('dateOfBirth')(e.target.value)} /></Field>
          <Field label="Жынысы">
            <select className="field" value={f.gender} onChange={(e) => set('gender')(e.target.value)}>
              <option value="">—</option>
              <option value="FEMALE">Әйел</option>
              <option value="MALE">Ер</option>
              <option value="OTHER">Басқа</option>
            </select>
          </Field>
        </div>
        <label className="flex items-start gap-2.5 text-[13px] text-muted">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--primary)]" />
          Бұл демонстрациялық платформа екенін, диагноз қоймайтынын және нақты медициналық деректерді енгізбеу керектігін түсінемін.
        </label>
        {error && <p className="rounded-xl bg-danger-soft px-3 py-2.5 text-[13px] text-danger">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={loading}>Аккаунт жасау</Button>
      </form>
      <p className="mt-6 text-center text-[14px] text-muted">Аккаунтыңыз бар ма? <Link to="/login" className="font-medium text-primary hover:underline">Кіру</Link></p>
    </AuthLayout>
  );
}
