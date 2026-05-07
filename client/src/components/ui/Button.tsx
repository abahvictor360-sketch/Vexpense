import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from '../../utils/clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  fullWidth,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 select-none';

  const variants = {
    primary:   'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 shadow-brand disabled:bg-brand-300',
    secondary: 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/50 focus:ring-brand-400 border border-brand-200 dark:border-brand-800',
    ghost:     'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 focus:ring-gray-300',
    danger:    'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400',
    outline:   'border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 focus:ring-gray-300 bg-white dark:bg-slate-900',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 h-8',
    md: 'text-sm px-4 py-2 h-10',
    lg: 'text-base px-5 py-2.5 h-11',
    xl: 'text-base px-6 py-3 h-13',
  };

  return (
    <button
      className={clsx(
        base,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-60 cursor-not-allowed active:scale-100',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
}
