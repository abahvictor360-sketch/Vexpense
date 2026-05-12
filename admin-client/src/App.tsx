import { Navigate, Route, Routes } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from './context/AuthContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Transactions } from './pages/Transactions';
import { AiMonitor } from './pages/AiMonitor';
import { HealthMonitor } from './pages/HealthMonitor';
import { Notifications } from './pages/Notifications';
import { SystemHealth } from './pages/SystemHealth';
import { SettingsPage } from './pages/Settings';

function AdminGuard({ children }: { children: ReactNode }) {
  const { admin, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-ink-dim">Loading…</div>
    );
  }
  if (!admin) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="ai" element={<AiMonitor />} />
        <Route path="health" element={<HealthMonitor />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="system" element={<SystemHealth />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
