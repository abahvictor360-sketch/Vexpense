import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BarChart2, Plus, Target, Building2
} from 'lucide-react';
import { clsx } from '../../utils/clsx';

const NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Home'     },
  { to: '/analytics',    icon: BarChart2,        label: 'Analytics'},
  { to: '/expenses/add', icon: Plus,             label: 'Add',      isAdd: true },
  { to: '/goals',        icon: Target,           label: 'Goals'    },
  { to: '/bank',         icon: Building2,        label: 'Bank'     },
];

export function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
      <div className="flex items-end h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label, isAdd }) => {
          if (isAdd) {
            return (
              <NavLink
                key={to}
                to={to}
                className="flex-1 flex flex-col items-center justify-center pb-2 gap-0.5"
              >
                {({ isActive }) => (
                  <>
                    <div className={clsx(
                      'w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-brand',
                      isActive ? 'bg-brand-700' : 'bg-brand-600'
                    )}>
                      <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className={clsx(
                      'text-[10px] font-medium leading-none',
                      isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-slate-500'
                    )}>
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          }

          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className="flex-1 flex flex-col items-center justify-center pb-2 gap-0.5"
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <div className={clsx(
                      'w-10 h-8 rounded-xl flex items-center justify-center transition-colors',
                      isActive ? 'bg-brand-50 dark:bg-brand-900/30' : 'bg-transparent'
                    )}>
                      <Icon
                        className={clsx(
                          'w-5 h-5 transition-colors',
                          isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-slate-500'
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    </div>
                  </div>
                  <span className={clsx(
                    'text-[10px] font-medium leading-none',
                    isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-slate-500'
                  )}>
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
