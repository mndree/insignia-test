import React, { useState } from 'react';
import { cn } from '@/utils/cn';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const COLOR_PAIRS = [
  'bg-indigo-100 text-indigo-700 border-indigo-200/60',
  'bg-sky-100 text-sky-700 border-sky-200/60',
  'bg-emerald-100 text-emerald-700 border-emerald-200/60',
  'bg-rose-100 text-rose-700 border-rose-200/60',
  'bg-amber-100 text-amber-700 border-amber-200/60',
  'bg-purple-100 text-purple-700 border-purple-200/60',
  'bg-teal-100 text-teal-700 border-teal-200/60',
  'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200/60',
];

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorForString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PAIRS.length;
  return COLOR_PAIRS[index];
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  className,
  size = 'md',
}) => {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name);
  const colorClass = getColorForString(name || 'user');

  const sizes = {
    sm: 'w-7 h-7 text-[11px] rounded-lg',
    md: 'w-10 h-10 text-xs font-bold rounded-xl',
    lg: 'w-12 h-12 text-sm font-bold rounded-2xl',
    xl: 'w-14 h-14 text-base font-bold rounded-2xl',
  };

  const hasImage = Boolean(avatarUrl) && !imageError;

  return (
    <div
      className={cn(
        'flex items-center justify-center font-bold tracking-tight select-none border shrink-0 overflow-hidden',
        colorClass,
        sizes[size],
        className
      )}
    >
      {hasImage ? (
        <img
          src={avatarUrl!}
          alt={name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
};
