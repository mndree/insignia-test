import React, { useState, useRef, useEffect } from 'react';
import { UserListItemDto } from '@/types';
import { UserAvatar } from '@/features/users/UserAvatar';
import { formatNumber } from '@/utils/formatters';
import { Search, ChevronDown, Check, X, User } from 'lucide-react';

interface UserSelectProps {
  label: string;
  users: UserListItemDto[];
  selectedUser: UserListItemDto | null;
  onSelect: (user: UserListItemDto) => void;
  excludeUserId?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

export const UserSelect: React.FC<UserSelectProps> = ({
  label,
  users,
  selectedUser,
  onSelect,
  excludeUserId,
  placeholder = 'Select a user...',
  disabled = false,
  required = false,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autofocus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter users by search term, exclude filter, and strictly exclude admin
  const filteredUsers = users
    .filter((u) => u.username.toLowerCase() !== 'admin')
    .filter((u) => {
      if (!excludeUserId) return true;
      return u.id !== excludeUserId && u.username.toLowerCase() !== excludeUserId.toLowerCase();
    })
    .filter((u) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      return (
        (u.fullName && u.fullName.toLowerCase().includes(term)) ||
        (u.username && u.username.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.userCode && u.userCode.toLowerCase().includes(term))
      );
    });

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="block text-xs font-bold uppercase tracking-wider text-navy-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      <div className="relative">
        {/* Dropdown trigger (Select2 style) */}
        <div
          role="combobox"
          aria-expanded={isOpen}
          tabIndex={disabled ? -1 : 0}
          onClick={() => {
            if (!disabled) setIsOpen(!isOpen);
          }}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          className={`w-full bg-white border rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-all ${
            disabled
              ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-70'
              : isOpen
              ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-xs'
              : error
              ? 'border-rose-400 hover:border-rose-500'
              : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          {selectedUser ? (
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <UserAvatar name={selectedUser.fullName || selectedUser.username} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-navy-900 truncate">
                    {selectedUser.fullName || selectedUser.username}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 truncate">
                    @{selectedUser.username}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 truncate">
                  <span>Balance:</span>
                  <span className="font-mono font-semibold text-brand-700">
                    {formatNumber(selectedUser.balance)} units
                  </span>
                  {selectedUser.email && (
                    <>
                      <span>•</span>
                      <span className="truncate">{selectedUser.email}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <User className="w-4 h-4 text-slate-300" />
              <span>{placeholder}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-slate-400 shrink-0 ml-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-600' : ''}`}
            />
          </div>
        </div>

        {/* Dropdown Popover */}
        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input Box */}
            <div className="p-2 border-b border-slate-100 bg-slate-50/70">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type to search user by name, username, email..."
                  className="w-full text-xs pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* User List */}
            <div className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-50">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No users found matching "{searchTerm}"
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = selectedUser?.id === u.id || selectedUser?.username === u.username;
                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        onSelect(u);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-brand-50 text-brand-900 font-medium'
                          : 'hover:bg-slate-50 text-navy-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar name={u.fullName || u.username} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold truncate">
                              {u.fullName || u.username}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 truncate">
                              @{u.username}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            {u.email || u.userCode || 'Active user'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-3 flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {formatNumber(u.balance)} units
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-brand-600" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
};
