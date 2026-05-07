import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AuthGuard } from './components/layout/AuthGuard';
import { PageLoader } from './components/ui/Spinner';
import { useAuth } from './hooks/useAuth';

const Login      = lazy(() => import('./pages/Login'));
const Register   = lazy(() => import('./pages/Register'));
const Dashboard  = lazy(() => import('./pages/Dashboard'));
const Expenses   = lazy(() => import('./pages/Expenses'));
const AddExpense = lazy(() => import('./pages/AddExpense'));
const Analytics  = lazy(() => import('./pages/Analytics'));
const Goals      = lazy(() => import('./pages/Goals'));
const Advisor    = lazy(() => import('./pages/Advisor'));
const Settings   = lazy(() => import('./pages/Settings'));
const Admin      = lazy(() => import('./pages/Admin'));

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useAuth();
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthInitializer>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"    element={<Dashboard />} />
              <Route path="/expenses"     element={<Expenses />} />
              <Route path="/expenses/add" element={<AddExpense />} />
              <Route path="/analytics"    element={<Analytics />} />
              <Route path="/goals"        element={<Goals />} />
              <Route path="/advisor"      element={<Advisor />} />
              <Route path="/settings"     element={<Settings />} />
              <Route path="/admin"        element={<Admin />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthInitializer>
    </BrowserRouter>
  );
}
