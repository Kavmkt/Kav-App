import { Navigate } from 'react-router-dom';
import LoginForm from '../../components/Auth/LoginForm';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { isAuthenticated, loading } = useAuth();

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-rose-50/40 px-4">
      <div className="mb-8 text-center">
        <p className="text-3xl">🎁</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-800">Clube de Presentes</h1>
        <p className="text-sm text-slate-500">Lily Cestas</p>
      </div>
      <LoginForm />
    </div>
  );
}
