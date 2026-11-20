import { StrictMode, lazy, Suspense, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import './index.css';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { AppShell } from '@/components/layout/AppShell';
import { LogoMark } from '@/components/ui/Logo';
import type { Role } from '@/lib/types';
import { ROLE_HOME } from '@/lib/utils';
import LandingPage from '@/features/auth/LandingPage';
import { LoginPage, RegisterPage } from '@/features/auth/AuthPages';

const BodyMapPage = lazy(() => import('@/features/patient/BodyMapPage'));
const DashboardPage = lazy(() => import('@/features/patient/DashboardPage'));
const HistoryPage = lazy(() => import('@/features/patient/HistoryPage'));
const PatientPages = () => import('@/features/patient/PatientPages');
const PrescriptionsPage = lazy(() => PatientPages().then((m) => ({ default: m.PrescriptionsPage })));
const AccessPage = lazy(() => PatientPages().then((m) => ({ default: m.AccessPage })));
const ProfilePage = lazy(() => PatientPages().then((m) => ({ default: m.ProfilePage })));
const MedicationsPage = lazy(() => import('@/features/common/MedicationsPage'));
const Doctor = () => import('@/features/doctor/DoctorPages');
const DoctorPatientsPage = lazy(() => Doctor().then((m) => ({ default: m.DoctorPatientsPage })));
const DoctorPatientPage = lazy(() => Doctor().then((m) => ({ default: m.DoctorPatientPage })));
const PharmacyPage = lazy(() => import('@/features/pharmacy/PharmacyPage'));
const Admin = () => import('@/features/admin/AdminPages');
const AdminOverview = lazy(() => Admin().then((m) => ({ default: m.AdminOverview })));
const AdminUsers = lazy(() => Admin().then((m) => ({ default: m.AdminUsers })));
const AdminRecords = lazy(() => Admin().then((m) => ({ default: m.AdminRecords })));
const AdminMedications = lazy(() => Admin().then((m) => ({ default: m.AdminMedications })));
const AdminLogs = lazy(() => Admin().then((m) => ({ default: m.AdminLogs })));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: false, retry: (n, e) => n < 1 && !(e as { status?: number }).status } },
});

function Splash() {
  return (
    <div className="grid h-full place-items-center">
      <div className="flex flex-col items-center gap-4">
        <LogoMark size={48} className="animate-pulse" />
        <div className="h-1 w-32 overflow-hidden rounded-full bg-surface-2"><div className="skeleton h-full w-full" /></div>
      </div>
    </div>
  );
}

function PageFallback() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-10 w-64 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
      <div className="skeleton h-80 rounded-2xl" />
    </div>
  );
}

/** Route guard: requires login and one of the allowed roles; otherwise redirects to the right place. */
function Protected({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <>{children}</>;
}

const S = ({ children }: { children: ReactNode }) => <Suspense fallback={<PageFallback />}>{children}</Suspense>;

function App() {
  const { dark } = useTheme();
  return (
    <>
      <Routes>
        <Route path="/" element={<PublicOnly><LandingPage /></PublicOnly>} />
        <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />

        <Route path="/app" element={<Protected roles={['PATIENT']}><AppShell /></Protected>}>
          <Route index element={<Navigate to="body-map" replace />} />
          <Route path="body-map" element={<S><BodyMapPage /></S>} />
          <Route path="dashboard" element={<S><DashboardPage /></S>} />
          <Route path="history" element={<S><HistoryPage /></S>} />
          <Route path="prescriptions" element={<S><PrescriptionsPage /></S>} />
          <Route path="access" element={<S><AccessPage /></S>} />
          <Route path="profile" element={<S><ProfilePage /></S>} />
          <Route path="medications" element={<S><MedicationsPage /></S>} />
        </Route>

        <Route path="/doctor" element={<Protected roles={['DOCTOR']}><AppShell /></Protected>}>
          <Route index element={<S><DoctorPatientsPage /></S>} />
          <Route path="patients/:id" element={<S><DoctorPatientPage /></S>} />
          <Route path="medications" element={<S><MedicationsPage /></S>} />
        </Route>

        <Route path="/pharmacy" element={<Protected roles={['PHARMACIST']}><AppShell /></Protected>}>
          <Route index element={<S><PharmacyPage /></S>} />
          <Route path="medications" element={<S><MedicationsPage /></S>} />
        </Route>

        <Route path="/admin" element={<Protected roles={['ADMIN']}><AppShell /></Protected>}>
          <Route index element={<S><AdminOverview /></S>} />
          <Route path="users" element={<S><AdminUsers /></S>} />
          <Route path="records" element={<S><AdminRecords /></S>} />
          <Route path="medications" element={<S><AdminMedications /></S>} />
          <Route path="logs" element={<S><AdminLogs /></S>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" theme={dark ? 'dark' : 'light'} richColors closeButton toastOptions={{ style: { fontFamily: 'inherit', borderRadius: 14 } }} />
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
