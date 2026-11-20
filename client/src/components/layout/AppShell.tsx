import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity, Bell, BookOpen, ClipboardList, FileText, LayoutDashboard, LogOut, Moon, Pill, ScanSearch, Shield, ShieldCheck, Sun, User, Users, Stethoscope, ScrollText, PersonStanding,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/primitives';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { api } from '@/lib/api';
import type { Notification, Role } from '@/lib/types';
import { cn, fmtRelative, ROLE_LABEL } from '@/lib/utils';

interface NavItem { to: string; label: string; icon: ReactNode; end?: boolean; mobile?: boolean }

const NAV: Record<Role, NavItem[]> = {
  PATIENT: [
    { to: '/app/body-map', label: '3D дене картасы', icon: <PersonStanding className="h-[18px] w-[18px]" />, mobile: true },
    { to: '/app/dashboard', label: 'Басты бет', icon: <LayoutDashboard className="h-[18px] w-[18px]" />, mobile: true },
    { to: '/app/history', label: 'Медициналық тарих', icon: <ClipboardList className="h-[18px] w-[18px]" />, mobile: true },
    { to: '/app/prescriptions', label: 'Тағайындаулар', icon: <Pill className="h-[18px] w-[18px]" />, mobile: true },
    { to: '/app/access', label: 'Қолжетімділік', icon: <ShieldCheck className="h-[18px] w-[18px]" /> },
    { to: '/app/medications', label: 'Дәрілер анықтамалығы', icon: <BookOpen className="h-[18px] w-[18px]" /> },
    { to: '/app/profile', label: 'Профиль', icon: <User className="h-[18px] w-[18px]" />, mobile: true },
  ],
  DOCTOR: [
    { to: '/doctor', label: 'Пациенттер', icon: <Users className="h-[18px] w-[18px]" />, end: true, mobile: true },
    { to: '/doctor/medications', label: 'Дәрілер анықтамалығы', icon: <BookOpen className="h-[18px] w-[18px]" />, mobile: true },
  ],
  PHARMACIST: [
    { to: '/pharmacy', label: 'Тағайындауды тексеру', icon: <ScanSearch className="h-[18px] w-[18px]" />, end: true, mobile: true },
    { to: '/pharmacy/medications', label: 'Дәрілер анықтамалығы', icon: <BookOpen className="h-[18px] w-[18px]" />, mobile: true },
  ],
  ADMIN: [
    { to: '/admin', label: 'Шолу', icon: <Activity className="h-[18px] w-[18px]" />, end: true, mobile: true },
    { to: '/admin/users', label: 'Қолданушылар', icon: <Users className="h-[18px] w-[18px]" />, mobile: true },
    { to: '/admin/records', label: 'Медициналық жазбалар', icon: <FileText className="h-[18px] w-[18px]" />, mobile: true },
    { to: '/admin/medications', label: 'Дәрілер базасы', icon: <Pill className="h-[18px] w-[18px]" />, mobile: true },
    { to: '/admin/logs', label: 'Аудит журналы', icon: <ScrollText className="h-[18px] w-[18px]" />, mobile: true },
  ],
};

const ROLE_ICON: Record<Role, ReactNode> = {
  PATIENT: <User className="h-3.5 w-3.5" />,
  DOCTOR: <Stethoscope className="h-3.5 w-3.5" />,
  PHARMACIST: <Pill className="h-3.5 w-3.5" />,
  ADMIN: <Shield className="h-3.5 w-3.5" />,
};

export function ThemeToggle({ className }: { className?: string }) {
  const { dark, toggle } = useTheme();
  return (
    <button onClick={toggle} aria-label="Тақырыпты ауыстыру" title={dark ? 'Жарық режим' : 'Қараңғы режим'} className={cn('grid h-10 w-10 place-items-center rounded-xl text-ink-2 transition hover:bg-surface-2 hover:text-ink', className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={dark ? 'd' : 'l'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
          {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data } = useQuery({ queryKey: ['notifications'], queryFn: () => api.get<{ items: Notification[]; unread: number }>('/notifications'), refetchInterval: 30000 });
  const readAll = useMutation({ mutationFn: () => api.post('/notifications/read-all'), onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) });
  const readOne = useMutation({ mutationFn: (id: number) => api.post(`/notifications/${id}/read`), onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) });
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label="Хабарламалар" className="relative grid h-10 w-10 place-items-center rounded-xl text-ink-2 transition hover:bg-surface-2 hover:text-ink">
        <Bell className="h-[18px] w-[18px]" />
        {!!data?.unread && <span className="absolute top-1.5 right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">{data.unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-x-3 top-16 z-50 max-h-[70vh] overflow-hidden rounded-2xl border border-line bg-surface shadow-pop sm:absolute sm:inset-x-auto sm:top-12 sm:right-0 sm:w-96"
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="text-[14px] font-semibold">Хабарламалар</p>
                {!!data?.unread && <button onClick={() => readAll.mutate()} className="text-[12px] font-medium text-primary hover:underline">Барлығын оқылды деу</button>}
              </div>
              <div className="max-h-[55vh] overflow-y-auto">
                {!data?.items.length && <p className="px-4 py-10 text-center text-[13px] text-muted">Хабарламалар жоқ</p>}
                {data?.items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (!n.readAt) readOne.mutate(n.id);
                      setOpen(false);
                      if (n.link) nav(n.link);
                    }}
                    className="flex w-full gap-3 border-b border-line px-4 py-3 text-left transition last:border-0 hover:bg-surface-2"
                  >
                    <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.readAt ? 'bg-transparent' : 'bg-primary')} />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium">{n.title}</span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-muted">{n.message}</span>
                      <span className="mt-1 block text-[11px] text-muted/80">{fmtRelative(n.createdAt)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  if (!user) return null;
  const items = NAV[user.role];
  const doLogout = async () => {
    await logout();
    nav('/login');
  };

  return (
    <div className="flex min-h-full">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col border-r border-line bg-surface/70 px-4 py-5 backdrop-blur-xl lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          <p className="eyebrow mb-2 px-3">{ROLE_LABEL[user.role]} панелі</p>
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                cn(
                  'group relative flex h-11 items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition',
                  isActive ? 'bg-primary-soft text-primary' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="nav-pill" className="absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-full bg-primary" />}
                  {it.icon}
                  {it.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="rounded-2xl border border-line bg-surface-2/60 p-3">
          <div className="flex items-center gap-3">
            <Avatar name={user.fullName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{user.fullName}</p>
              <p className="flex items-center gap-1 text-[12px] text-muted">{ROLE_ICON[user.role]} {ROLE_LABEL[user.role]}</p>
            </div>
            <button onClick={doLogout} aria-label="Шығу" title="Шығу" className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-danger">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-bg/75 px-4 backdrop-blur-xl sm:px-6">
          <div className="lg:hidden">
            <Logo compact />
          </div>
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-[13px] text-muted">
              {items.find((i) => (i.end ? loc.pathname === i.to : loc.pathname.startsWith(i.to)))?.label ?? 'MEDMAP 3D'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span className="mr-1 hidden h-7 items-center gap-1.5 rounded-full bg-warning-soft px-2.5 text-[11px] font-semibold text-warning sm:flex">DEMO · синтетикалық деректер</span>
            <ThemeToggle />
            <NotificationsBell />
            <button onClick={doLogout} aria-label="Шығу" className="grid h-10 w-10 place-items-center rounded-xl text-ink-2 hover:bg-surface-2 lg:hidden">
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pb-10">
          {/* Enter-only page transition: <Outlet/> always renders the current route, so an exit animation would show the wrong page. */}
          <motion.div key={loc.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),8px)] backdrop-blur-xl lg:hidden">
        <div className="flex justify-around">
          {items.filter((i) => i.mobile).slice(0, 5).map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => cn('flex min-w-[60px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-medium transition', isActive ? 'text-primary' : 'text-muted')}>
              {it.icon}
              <span className="max-w-[72px] truncate">{it.label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
