import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, BarChart3, Target,
  MessageSquareHeart, Settings, LogOut, ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getInitials } from '../../utils';
import { clsx } from '../../utils/clsx';
import toast from 'react-hot-toast';

const ADMIN_EMAIL = 'abahvictor760@gmail.com';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard,   label: 'Dashboard'  },
  { to: '/expenses',  icon: Receipt,            label: 'Expenses'   },
  { to: '/analytics', icon: BarChart3,          label: 'Analytics'  },
  { to: '/goals',     icon: Target,             label: 'Goals'      },
  { to: '/advisor',   icon: MessageSquareHeart, label: 'AI Advisor' },
  { to: '/settings',  icon: Settings,           label: 'Settings'   },
];

export function Sidebar() {
  const { profile, signOut } = useAuthStore();
  const isAdmin = profile?.email === ADMIN_EMAIL;
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/login');
  };

  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen fixed left-0 top-0 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-brand">
            <span className="text-white font-bold text-lg leading-none">V</span>
          </div>
          <div>
            <span className="font-bold text-gray-900 dark:text-white text-lg leading-none">
              <span className="text-brand-600">V</span>expense
            </span>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 leading-tight">Smart Finance</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
              isActive
                ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-semibold'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            {({ isActive }) => (
              <>
                <div className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                  isActive
                    ? 'bg-brand-100 dark:bg-brand-900/50'
                    : 'bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-slate-700'
                )}>
                  <Icon className={clsx('w-4 h-4', isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-slate-500')} />
                </div>
                <span>{label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-600 dark:bg-brand-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Admin link */}
      {isAdmin && (
        <div className="px-3 pb-1">
          <NavLink
            to="/admin"
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive
                ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            {({ isActive }) => (
              <>
                <div className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  isActive ? 'bg-brand-100 dark:bg-brand-900/50' : 'bg-gray-100 dark:bg-slate-800'
                )}>
                  <ShieldCheck className={clsx('w-4 h-4', isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-slate-500')} />
                </div>
                <span>Admin</span>
                <span className="ml-auto px-1.5 py-0.5 bg-brand-600 text-white text-[9px] font-bold rounded-full">ADMIN</span>
              </>
            )}
          </NavLink>
        </div>
      )}

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
            style={{ backgroundColor: profile?.avatar_color ?? '#534AB7' }}
          >
            {getInitials(profile?.full_name ?? '')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {profile?.full_name ?? 'User'}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
              {profile?.country_name ?? ''}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
