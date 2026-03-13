import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/app/store';
import LoginPage from '@/pages/LoginPage';
import Dashboard from '@/pages/Dashboard';
import { loadProfile } from '@/features/auth/authSlice';

export default function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(loadProfile());
    }
  }, [dispatch, token, user]);

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={token ? <Dashboard /> : user ? <Dashboard /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to={user || token ? '/' : '/login'} replace />} />
    </Routes>
  );
}

