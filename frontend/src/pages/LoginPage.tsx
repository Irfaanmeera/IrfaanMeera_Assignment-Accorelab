import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
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
    <div className="flex min-h-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg">
              <FileText className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900">Invoice Dashboard</h1>
              <p className="mt-1 text-center text-sm text-slate-500">Sign in to continue</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <Input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                }}
                type="email"
                placeholder="you@example.com"
                className={`h-11 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                }}
                placeholder="••••••••"
                className={`h-11 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              {errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              className="mt-6 h-11 w-full bg-indigo-600 text-base font-medium hover:bg-indigo-700"
              disabled={status === 'loading'}
              onClick={handleSubmit}
            >
              {status === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
