import React from 'react';
import { cn } from '@/utils/cn';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const isActive = status?.toLowerCase() === 'active';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium select-none',
        isActive
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
          : 'bg-slate-100 text-slate-600 border border-slate-200/60',
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          isActive ? 'bg-emerald-500' : 'bg-slate-400'
        )}
      />
      <span>{isActive ? 'Active' : 'Inactive'}</span>
    </span>
  );
};
