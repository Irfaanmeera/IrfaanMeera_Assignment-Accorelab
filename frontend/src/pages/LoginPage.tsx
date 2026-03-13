import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/app/store';
import { login } from '@/features/auth/authSlice';
import { loginSchema } from '@/lib/validations';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const dispatch = useDispatch<AppDispatch>();
  const nav = useNavigate();
  const { user, status, error } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (user) nav('/', { replace: true });
  }, [user, nav]);

  function handleSubmit() {
    setErrors({});
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.issues.forEach((e: { path: (string | number)[]; message: string }) => {
        const path = e.path[0] as 'email' | 'password';
        if (path && !fieldErrors[path]) fieldErrors[path] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    dispatch(login(result.data));
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Login</h1>
      

        <div className="mt-6 space-y-3">
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">Email</div>
            <Input
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="email"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <div className="mt-1 text-sm text-red-600">{errors.email}</div>}
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">Password</div>
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
              }}
              placeholder="password"
              className={errors.password ? 'border-red-500' : ''}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            {errors.password && <div className="mt-1 text-sm text-red-600">{errors.password}</div>}
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <Button className="w-full" disabled={status === 'loading'} onClick={handleSubmit}>
            {status === 'loading' ? 'Logging in...' : 'Login'}
          </Button>
        </div>
      </div>
    </div>
  );
}

