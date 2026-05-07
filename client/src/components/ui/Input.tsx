import React from 'react';
import { clsx } from '../../utils/clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
}

export function Input({
  label,
  error,
  hint,
  icon,
  iconRight,
  inputSize = 'md',
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  const sizes = {
    sm: 'h-9 text-sm px-3',
    md: 'h-11 text-sm px-4',
    lg: 'h-13 text-base px-4',
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={clsx(
            'w-full rounded-xl border bg-white transition-all duration-150 outline-none',
            'placeholder:text-gray-400 text-gray-900',
            'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
            error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-gray-200',
            icon ? 'pl-10' : '',
            iconRight ? 'pr-10' : '',
            sizes[inputSize],
            className
          )}
          {...props}
        />
        {iconRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {iconRight}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 flex items-center gap-1">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
