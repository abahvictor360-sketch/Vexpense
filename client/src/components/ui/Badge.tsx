import React from 'react';
import { clsx } from '../../utils/clsx';

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  variant?: 'solid' | 'soft';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, color, variant = 'soft', size = 'sm', className }: BadgeProps) {
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  if (color) {
    const bg = variant === 'solid' ? color : `${color}20`;
    const text = variant === 'solid' ? '#fff' : color;
    return (
      <span
        className={clsx('inline-flex items-center rounded-full font-medium', sizeStyles[size], className)}
        style={{ backgroundColor: bg, color: text }}
      >
        {children}
      </span>
    );
  }

  return (
    <span className={clsx(
      'inline-flex items-center rounded-full font-medium bg-gray-100 text-gray-700',
      sizeStyles[size], className
    )}>
      {children}
    </span>
  );
}
