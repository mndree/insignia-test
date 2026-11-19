import React, { useState, useMemo } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUserDetailsApi, getUsersListApi } from '@/services/api/endpoints';
import { UserAvatar } from './UserAvatar';
import { StatusBadge } from './StatusBadge';
import { TransferBalanceModal } from './TransferBalanceModal';
import { EditProfileModal } from './EditProfileModal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { TableColumnHeader, SortOrder } from '@/components/ui/TableColumnHeader';
import { formatNumber, formatShortDate } from '@/utils/formatters';
import { normalizeApiError } from '@/services/api/client';
import {
  ArrowLeft,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  Edit,
  Clock,
  RefreshCw,
  ArrowLeftRight,
} from 'lucide-react';

export const UserDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  useOutletContext<{ onOpenSidebar: () => void }>();

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sortField, setSortField] = useState<string | null>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 1. Fetch user details
  const {
    data: user,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin_user_details', id],
    queryFn: () => getUserDetailsApi(id || ''),
    enabled: Boolean(id),
  });

  // 2. Fetch list of users for recipient selection in transfer modal
  const { data: usersList } = useQuery({
    queryKey: ['admin_users_all'],
    queryFn: () => getUsersListApi({ pageSize: 50 }),
  });

  const recentTransactions = user?.recentTransactions ?? [];

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedTransactions = useMemo(() => {
    if (!sortField) return recentTransactions;
    const list = [...recentTransactions];
    const isAsc = sortOrder === 'asc';

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'id') {
        cmp = a.id.localeCompare(b.id);
      } else if (sortField === 'counterparty') {
        cmp = a.counterparty.localeCompare(b.counterparty);
      } else if (sortField === 'direction') {
        cmp = a.direction.localeCompare(b.direction);
      } else if (sortField === 'amount') {
        cmp = a.amount - b.amount;
      } else if (sortField === 'date') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return isAsc ? cmp : -cmp;
    });

    return list;
  }, [recentTransactions, sortField, sortOrder]);

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading user details...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Link
          to="/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Users
        </Link>
        <Alert variant="error" title="User Not Found">
          {error ? normalizeApiError(error).message : `User '${id}' could not be located.`}
        </Alert>
      </div>
    );
  }

  const { stats } = user;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Back Link */}
      <div className="space-y-1">
        <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
          <Link to="/users" className="hover:text-navy-900 transition-colors">
            Users
          </Link>
          <span>/</span>
          <span className="text-navy-900 font-semibold">{user.fullName}</span>
        </div>

        <div>
          <Link
            to="/users"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-0.5" />
            Back to Users
          </Link>
        </div>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-900">
          User Details
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          View biodata, wallet balance and transaction activity.
        </p>
      </div>

      {/* User Summary Banner Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <UserAvatar name={user.fullName || user.username} size="xl" />
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight leading-tight truncate">
              {user.fullName}
            </h2>
            <div className="flex flex-wrap items-center gap-2.5 mt-1">
              <span className="text-xs font-mono text-slate-400 font-semibold">
                @{user.username}
              </span>
              <StatusBadge status={user.status} />
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-xs font-semibold">
                ID {user.userCode}
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditModalOpen(true)}
          className="self-start sm:self-center bg-white hover:bg-slate-50 border-slate-200 text-navy-800 font-semibold"
        >
          <Edit className="w-3.5 h-3.5 mr-1.5 text-brand-600" />
          Edit Profile
        </Button>
      </div>

      {/* Middle Grid: Biodata & Wallet Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: USER BIODATA */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-700 pb-3 border-b border-slate-100">
              User Biodata
            </h3>

            <div className="divide-y divide-slate-100 text-xs sm:text-sm">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Full name</span>
                <span className="font-semibold text-navy-900">{user.fullName}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Username</span>
                <span className="font-mono font-semibold text-navy-900">@{user.username}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Email</span>
                <span className="text-navy-800">{user.email}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Phone</span>
                <span className="text-navy-800">{user.phone}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Date of birth</span>
                <span className="text-navy-800">{user.dateOfBirth}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Address</span>
                <span className="text-navy-800">{user.address}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Joined</span>
                <span className="text-navy-800">{formatShortDate(user.createdAt)}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Last login</span>
                <span className="text-navy-800">{formatShortDate(user.lastLoginAt)}, 04:35 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: WALLET BALANCE */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-700">
                Wallet Balance
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <button
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="hover:text-navy-900 transition-colors p-0.5 focus-ring rounded"
                  title="Refresh wallet balance"
                >
                  <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin text-brand-600' : ''}`} />
                </button>
                <span>Last updated just now</span>
              </div>
            </div>

            {/* Available Balance Big Display */}
            <div className="mt-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-600 shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Available balance
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight font-mono">
                  {formatNumber(stats.availableBalance)}{' '}
                  <span className="text-sm font-semibold text-slate-500 font-sans">units</span>
                </span>
              </div>
            </div>
          </div>

          {/* Transfer Action Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsTransferModalOpen(true)}
            className="w-full font-bold shadow-xs py-3"
          >
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            Transfer Balance
          </Button>

          {/* Bottom Sub-cards: Total Received & Total Sent */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Total Received */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100/90 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                  Total Received
                </span>
                <span className="text-base font-extrabold text-emerald-950 font-mono">
                  {formatNumber(stats.totalReceived)}{' '}
                  <span className="text-xs font-normal">units</span>
                </span>
              </div>
            </div>

            {/* Total Sent */}
            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100/90 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-rose-800 uppercase tracking-wider">
                  Total Sent
                </span>
                <span className="text-base font-extrabold text-rose-950 font-mono">
                  {formatNumber(stats.totalSent)}{' '}
                  <span className="text-xs font-normal">units</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: RECENT TRANSACTIONS Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-700">
              Recent Transactions
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              ({sortedTransactions.length} items appearing)
            </span>
          </div>
          <Link
            to={`/transactions?search=${user.username}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            View All
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No recent transactions recorded for this user.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <TableColumnHeader
                    label="ID"
                    field="id"
                    currentSortField={sortField}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <TableColumnHeader
                    label="Counterparty"
                    field="counterparty"
                    currentSortField={sortField}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <TableColumnHeader
                    label="Direction"
                    field="direction"
                    currentSortField={sortField}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <TableColumnHeader
                    label="Amount"
                    field="amount"
                    currentSortField={sortField}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                    align="right"
                  />
                  <TableColumnHeader
                    label="Date"
                    field="date"
                    currentSortField={sortField}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                    align="right"
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sortedTransactions.map((txn) => {
                  const isIncoming = txn.direction === 'incoming';
                  return (
                    <tr key={txn.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-mono text-xs font-semibold text-navy-900 whitespace-nowrap">
                        {txn.id}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <UserAvatar name={txn.counterpartyName || txn.counterparty} size="sm" />
                          <span className="font-mono text-xs font-semibold text-navy-800">
                            @{txn.counterparty}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium select-none ${
                            isIncoming
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isIncoming ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span>{isIncoming ? 'Incoming' : 'Outgoing'}</span>
                        </span>
                      </td>

                      <td
                        className={`py-3.5 px-4 sm:px-6 text-right font-mono font-bold whitespace-nowrap ${
                          isIncoming ? 'text-incoming' : 'text-outgoing'
                        }`}
                      >
                        {isIncoming ? `+${formatNumber(Math.abs(txn.amount))}` : `-${formatNumber(Math.abs(txn.amount))}`}{' '}
                        <span className="font-sans font-normal text-xs text-slate-500">units</span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right text-xs text-slate-500 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 justify-end">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatShortDate(txn.createdAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <TransferBalanceModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        currentUser={user}
        availableUsers={usersList?.items || []}
      />

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
      />
    </div>
  );
};
