import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/app/store';
import LoginPage from '@/pages/LoginPage';
import Dashboard from '@/pages/Dashboard';
import { loadProfile } from '@/features/auth/authSlice';

export default function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, status } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(loadProfile());
    }
  }, [dispatch, token, user]);

  // Restoring session: token exists but user not hydrated yet
  const restoringSession = token && !user && status !== 'failed';

  if (restoringSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
}

