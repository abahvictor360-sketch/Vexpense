import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, PlusCircle, Target, MessageSquareHeart
} from 'lucide-react';
import { clsx } from '../../utils/clsx';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home'     },
  { to: '/expenses',  icon: Receipt,         label: 'Expenses' },
  { to: '/expenses/add', icon: PlusCircle,   label: 'Add',     isCTA: true },
  { to: '/goals',     icon: Target,          label: 'Goals'    },
  { to: '/advisor',   icon: MessageSquareHeart, label: 'Advisor' },
];

export function BottomNav() {
  const navigate = useNavigate();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-gray-200/80">
      <div className="flex items-center h-16 px-2" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label, isCTA }) => {
          if (isCTA) {
            return (
              <div key={to} className="flex-1 flex justify-center">
                <button
                  onClick={() => navigate(to)}
                  className="w-14 h-14 -mt-5 rounded-2xl bg-brand-gradient shadow-brand flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                </button>
              </div>
            );
          }
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/expenses'}
              className={({ isActive }) => clsx(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors',
                isActive ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {({ isActive }) => (
                <>
                  <div className={clsx(
                    'w-8 h-8 rounded-xl flex items-center justify-center transition-colors',
                    isActive ? 'bg-brand-50' : 'bg-transparent'
                  )}>
                    <Icon className={clsx('w-5 h-5', isActive ? 'text-brand-600' : '')} />
                  </div>
                  <span className={clsx('text-[10px] font-medium leading-none', isActive ? 'text-brand-600' : '')}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
