import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, emoji, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4">
        {emoji ? (
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl">
            {emoji}
          </div>
        ) : icon ? (
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
            {icon}
          </div>
        ) : null}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-xs mb-5">{description}</p>}
      {action && (
        <Button variant="primary" size="md" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
