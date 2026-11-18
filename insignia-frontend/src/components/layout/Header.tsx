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
    <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-4 transition-all">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-navy-900 hover:bg-slate-200/70 focus-ring"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-900 truncate">
              {title}
            </h1>
            {description && (
              <p className="text-xs sm:text-sm text-slate-500 truncate hidden sm:block">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DemoBadge />
          {actions}
        </div>
      </div>
    </header>
  );
};
