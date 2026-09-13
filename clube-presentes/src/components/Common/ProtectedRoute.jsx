import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Loader label="Verificando sessão..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}
