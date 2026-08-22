import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingState';

export function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner className="h-8 w-8" /></div>;
  }

  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}
