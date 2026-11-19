import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { getAdminProfileApi } from '@/services/api/endpoints';
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  TrendingUp,
  Trophy,
  LogOut,
  X,
  Lock,
  UserPen,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';
import { ChangeBiodataModal } from './ChangeBiodataModal';
import { cn } from '@/utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SidebarContentProps {
  onClose?: () => void;
  onOpenChangePassword: () => void;
  onOpenChangeBiodata: () => void;
}

const navItems = [
  { name: 'Overview', to: '/', icon: LayoutDashboard },
  { name: 'Users', to: '/users', icon: Users },
  { name: 'Transactions', to: '/transactions', icon: ArrowLeftRight },
  { name: 'Top Transactions', to: '/top-transactions', icon: TrendingUp },
  { name: 'Top Users', to: '/top-users', icon: Trophy },
];

const SidebarContent: React.FC<SidebarContentProps> = ({
  onClose,
  onOpenChangePassword,
  onOpenChangeBiodata,
}) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);

  const { data: adminProfile } = useQuery({
    queryKey: ['admin_profile', user?.username || 'admin'],
    queryFn: () => getAdminProfileApi(user?.username || 'admin'),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (footerRef.current && !footerRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isMenuOpen]);

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <img
            src="/favicon.png"
            alt="Insignia Wallet"
            className="w-10 h-10 rounded-xl object-contain shadow-xs select-none"
          />
          <div>
            <h1 className="text-base font-bold tracking-tight text-navy-900">
              Insignia Wallet
            </h1>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Admin Dashboard
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus-ring"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto" aria-label="Main Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group select-none',
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm font-semibold'
                    : 'text-navy-700 hover:bg-slate-100 hover:text-navy-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-navy-800'
                    )}
                  />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Authenticated User & Popup Menu */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 relative" ref={footerRef}>
        {/* Popup Menu (Change Password / Change Biodata) */}
        {isMenuOpen && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute bottom-full left-3.5 right-3.5 mb-2.5 bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
          >
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenChangePassword();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-navy-900 bg-indigo-50/70 hover:bg-indigo-100/80 transition-colors text-left group cursor-pointer"
            >
              <Lock className="w-4 h-4 text-navy-800 stroke-[2.2]" />
              <span>Change Password</span>
            </button>

            <div className="h-px bg-slate-100 my-1 mx-2" />

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenChangeBiodata();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-navy-900 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
            >
              <UserPen className="w-4 h-4 text-navy-800 stroke-[2.2]" />
              <span>Change Biodata</span>
            </button>
          </div>
        )}

        {/* User Footer Card */}
        <div className="flex items-center justify-between gap-2.5 p-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-2.5 min-w-0 flex-1 text-left hover:opacity-90 transition-opacity focus-ring rounded-xl p-1 -m-1 cursor-pointer"
            title="Account options"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-700 font-extrabold text-sm uppercase shrink-0 select-none overflow-hidden">
              {(adminProfile as any)?.avatarUrl ? (
                <img
                  src={(adminProfile as any).avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                user?.username ? user.username.slice(0, 2).toUpperCase() : 'AD'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm font-bold text-navy-900 truncate">
                  @{user?.username || 'admin'}
                </span>
                {isMenuOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-navy-700 stroke-[2.5]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
                )}
              </div>
              <span className="block text-[11px] text-slate-400 font-medium truncate mt-0.5">
                Active Session
              </span>
            </div>
          </button>

          <button
            onClick={logout}
            title="Log out of session"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors focus-ring shrink-0 cursor-pointer"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isChangeBiodataOpen, setIsChangeBiodataOpen] = useState(false);

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-30">
        <SidebarContent
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
          onOpenChangeBiodata={() => setIsChangeBiodataOpen(true)}
        />
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white transform transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent
          onClose={onClose}
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
          onOpenChangeBiodata={() => setIsChangeBiodataOpen(true)}
        />
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        username={user?.username || 'admin'}
      />

      <ChangeBiodataModal
        isOpen={isChangeBiodataOpen}
        onClose={() => setIsChangeBiodataOpen(false)}
        username={user?.username || 'admin'}
      />
    </>
  );
};
