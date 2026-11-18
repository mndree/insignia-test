import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  Trophy,
  LogOut,
  Wallet,
  X,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Overview', to: '/', icon: LayoutDashboard },
    { name: 'Transactions', to: '/transactions', icon: ArrowLeftRight },
    { name: 'Top Transactions', to: '/top-transactions', icon: TrendingUp },
    { name: 'Top Users', to: '/top-users', icon: Trophy },
  ];

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-navy-900">
              Insignia Wallet
            </h1>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Admin Dashboard
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus-ring"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
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

      {/* Authenticated User & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-700 shrink-0 font-bold text-xs uppercase">
              {user?.username ? user.username.slice(0, 2) : <UserCheck className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-navy-900 truncate">
                @{user?.username || 'user'}
              </p>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                Active Session
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Log out of session"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus-ring"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-30">
        {content}
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
        {content}
      </div>
    </>
  );
};
