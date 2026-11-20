import React from 'react';
import { APP_CONFIG } from '@/app/config';
import { Sparkles } from 'lucide-react';

export const DemoBadge: React.FC<{ className?: string }> = ({ className }) => {
  if (APP_CONFIG.isLiveMode) {
    return null;
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
