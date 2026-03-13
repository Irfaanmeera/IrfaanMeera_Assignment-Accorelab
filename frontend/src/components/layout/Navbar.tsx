import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/app/store';
import { logout } from '@/features/auth/authSlice';

export default function Navbar() {
  const user = useSelector((s: RootState) => s.auth.user);
  const dispatch = useDispatch();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ backgroundColor: '#1F7DC2' }}>
            <FileText className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-slate-900">Invoice Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden text-sm sm:block">
              <span className="text-slate-600">{user.username}</span>
              <span className="mx-1.5 text-slate-400">·</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700">
                {user.role}
              </span>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => dispatch(logout())} className="border-slate-200">
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
