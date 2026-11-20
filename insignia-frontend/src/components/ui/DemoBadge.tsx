import React from 'react';
import { APP_CONFIG } from '@/app/config';
import { Sparkles, Database } from 'lucide-react';

export const DemoBadge: React.FC<{ className?: string }> = ({ className }) => {
  if (APP_CONFIG.isLiveMode) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs ${className || ''}`}
        title="Connected to live PostgreSQL database and NestJS backend API"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <Database className="w-3.5 h-3.5 text-emerald-600" />
        <span>PostgreSQL Database</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80 ${className || ''}`}
      title="Running in Demo Mode with Mock Service Worker simulation"
    >
      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
      <span>Demo Data Mode</span>
    </div>
  );
};
