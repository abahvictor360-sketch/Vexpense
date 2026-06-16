import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export function PWAInstallBanner() {
  const { isInstallable, install, dismiss } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-24 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:w-80 z-50 slide-up-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-[0_8px_32px_rgba(83,74,183,0.2)] border border-brand-100 dark:border-brand-900/50 px-4 py-3.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">Install Vexpense</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-tight">Add to home screen for app-like experience</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={install}
            className="px-3 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700 transition-colors"
          >
            Install
          </button>
          <button
            onClick={dismiss}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
