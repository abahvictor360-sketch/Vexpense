import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Users,
  Receipt,
  Bot,
  HeartPulse,
  Bell,
  ServerCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Keyboard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { Modal } from '../ui/Modal';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/ai', label: 'AI Monitor', icon: Bot },
  { to: '/health', label: 'Health Monitor', icon: HeartPulse },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/system', label: 'System Health', icon: ServerCog },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { helpOpen, setHelpOpen } = useKeyboardShortcuts();

  const currentLabel =
    NAV.find((n) => (n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)))
      ?.label ?? 'Admin';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-bg text-ink">
      <aside
        style={{ width: collapsed ? 64 : 240 }}
        className="bg-bg-card border-r border-line flex flex-col transition-[width] duration-200"
      >
        <div className="h-16 flex items-center px-4 border-b border-line shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-accent" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">Vexpense</div>
                <div className="text-xs text-ink-muted truncate">Admin Console</div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-accent/15 text-ink border border-accent/30'
                      : 'text-ink-dim hover:bg-bg-hover hover:text-ink border border-transparent'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-2 border-t border-line space-y-1">
          {!collapsed && admin && (
            <div className="px-3 py-2 text-xs text-ink-muted">
              <div className="truncate text-ink">{admin.name}</div>
              <div className="truncate">{admin.email}</div>
              <div className="mt-1 inline-block px-1.5 py-0.5 rounded bg-accent/10 text-accent text-[10px] uppercase tracking-wider">
                {admin.role.replace('_', ' ')}
              </div>
            </div>
          )}
          <button
            onClick={() => setHelpOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-dim hover:bg-bg-hover hover:text-ink"
          >
            <Keyboard className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Shortcuts</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-dim hover:bg-bg-hover hover:text-err"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-dim hover:bg-bg-hover hover:text-ink"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-line px-6 flex items-center justify-between shrink-0 bg-bg/80 backdrop-blur">
          <div>
            <div className="text-xs text-ink-muted">Admin</div>
            <h1 className="text-lg font-semibold leading-tight">{currentLabel}</h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-ink-muted">
            <span>v2 • {new Date().toLocaleDateString()}</span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Keyboard shortcuts">
        <div className="space-y-2 text-sm">
          {[
            ['G then H', 'Dashboard'],
            ['G then U', 'Users'],
            ['G then T', 'Transactions'],
            ['G then A', 'AI Monitor'],
            ['G then N', 'Notifications'],
            ['G then S', 'Settings'],
            ['?', 'Toggle this help'],
          ].map(([keys, label]) => (
            <div key={keys} className="flex items-center justify-between">
              <span className="text-ink-dim">{label}</span>
              <kbd className="px-2 py-0.5 rounded bg-bg-hover border border-line text-xs font-mono">{keys}</kbd>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
