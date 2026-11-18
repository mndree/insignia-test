import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Card, CardContent } from '@/components/ui/Card';
import { getTopUsersApi } from '@/services/api/endpoints';
import { formatWalletUnits } from '@/utils/formatters';
import { normalizeApiError } from '@/services/api/client';
import {
  Trophy,
  RefreshCw,
  Medal,
  Users,
  Info,
  UserCheck,
} from 'lucide-react';

export const TopUsersPage: React.FC = () => {
  const { onOpenSidebar } = useOutletContext<{ onOpenSidebar: () => void }>();
  const { user: currentUser } = useAuth();

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['top_users'],
    queryFn: getTopUsersApi,
  });

  const users = data || [];

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold text-xs ring-2 ring-amber-300">
          <Medal className="w-4 h-4 text-amber-600" />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs ring-2 ring-slate-300">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/10 text-amber-800 font-bold text-xs ring-2 ring-amber-600/30">
          3
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-slate-400 font-semibold text-xs">
        #{rank}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <Header
        onOpenSidebar={onOpenSidebar}
        title="Top Transacting Users"
        description="Platform leaderboard ranked by total aggregated outgoing transfer volume"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh top users"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Specification Context Callout */}
      <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-start gap-3 text-xs text-navy-800">
        <Info className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-brand-700">Documented Contract Rules</span>
            <Badge variant="default" size="sm">Top 10 Senders</Badge>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Per the Stoplight specification for <code className="font-mono font-bold text-navy-900">GET /top_users</code>:
            Users are ranked strictly by total aggregated outgoing transfer value (sent to other users).
            Incoming transfers and balance top-ups do not count toward this leaderboard. Values are displayed as positive numbers.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Failed to Fetch Leaderboard">
          <div className="flex items-center justify-between gap-3">
            <span>{normalizeApiError(error).message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-10 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-slate-500 font-medium">Computing leaderboard rankings...</p>
        </div>
      ) : users.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-navy-900">No Outgoing Transfers Recorded</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No users have completed outgoing transfers yet. Users will appear here once they send wallet units.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th scope="col" className="py-3 px-4 sm:px-6 w-20">Rank</th>
                  <th scope="col" className="py-3 px-4 sm:px-6">Username</th>
                  <th scope="col" className="py-3 px-4 sm:px-6 text-right">Total Sent (Outgoing)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((item, index) => {
                  const rank = index + 1;
                  const isCurrent =
                    currentUser?.username?.toLowerCase() === item.username.toLowerCase();

                  return (
                    <tr
                      key={`${item.username}-${index}`}
                      className={`transition-colors ${
                        isCurrent
                          ? 'bg-brand-50/60 font-semibold border-l-4 border-l-brand-600'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        {getRankBadge(rank)}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-navy-900 font-mono">
                            @{item.username}
                          </span>
                          {isCurrent && (
                            <Badge variant="default" size="sm">
                              <UserCheck className="w-3 h-3 text-brand-600" />
                              You
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap font-mono font-bold text-navy-900">
                        {formatWalletUnits(item.transacted_value, { absolute: true })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="py-3 px-6 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Top {users.length} transacting users
            </span>
            <span className="text-slate-400">Strictly outgoing transfers</span>
          </div>
        </div>
      )}
    </div>
  );
};
