import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import { LoadingSpinner } from './StateBlocks.jsx';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner label="Verifying your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
