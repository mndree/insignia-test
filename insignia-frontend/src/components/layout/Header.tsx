import React from 'react';
import { Menu } from 'lucide-react';
import { DemoBadge } from '@/components/ui/DemoBadge';

interface HeaderProps {
  onOpenSidebar: () => void;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  title,
  description,
  actions,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-navy-900 hover:bg-slate-200/70 focus-ring"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-2xl font-bold tracking-tight text-navy-900">
            {title}
          </h1>
        </div>
        {description && (
          <p className="text-sm text-slate-500 mt-0.5">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <DemoBadge />
        {actions}
      </div>
    </div>
  );
};
