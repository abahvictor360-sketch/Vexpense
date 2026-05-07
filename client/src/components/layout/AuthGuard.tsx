import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { PageLoader } from '../ui/Spinner';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();

  // Already authenticated — let through immediately, don't wait for loading
  if (user) return <>{children}</>;

  // Still resolving initial session — show loader
  if (loading) return <PageLoader />;

  // No user, not loading — go to login
  return <Navigate to="/login" replace />;
}
