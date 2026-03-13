import { Button } from '@/components/ui/button';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/app/store';
import { logout } from '@/features/auth/authSlice';

export default function Navbar() {
  const user = useSelector((s: RootState) => s.auth.user);
  const dispatch = useDispatch();

  return (
    <div className="flex items-center justify-between border-b bg-white px-6 py-4">
      <div className="font-semibold text-slate-900">Invoice / Payment Dashboard</div>
      <div className="flex items-center gap-3">
        {user && (
          <div className="text-sm text-slate-600">
            {user.username} · <span className="font-medium">{user.role}</span>
          </div>
        )}
        <Button variant="secondary" onClick={() => dispatch(logout())}>
          Logout
        </Button>
      </div>
    </div>
  );
}

