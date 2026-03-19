import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return null; // Wait for the context to finish checking localStorage

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export const RoleRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  // Case-insensitive role check for SaaS stability [cite: 168, 203]
  const userRole = user.role.toLowerCase();
  const isAllowed = allowedRoles.some(role => role.toLowerCase() === userRole);

  if (!isAllowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? children : <Outlet />;
};