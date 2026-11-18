import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { formatNumber, formatShortDate } from '@/utils/formatters';
import { TransactionRecordDto } from '@/types';
import { ArrowDownLeft, ArrowUpRight, BarChart3, Calendar, Info } from 'lucide-react';

interface OverviewChartsProps {
  transactions: TransactionRecordDto[];
  isLoading: boolean;
  isAvailable: boolean;
  totalTransactionsCount: number;
}

export const OverviewCharts: React.FC<OverviewChartsProps> = ({
  transactions,
  isLoading,
  isAvailable,
  totalTransactionsCount,
}) => {
  if (!isAvailable) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction Analytics</CardTitle>
              <CardDescription>Visual metrics on transfer volume and flow</CardDescription>
            </div>
            <Badge variant="warning">Unavailable in Live Mode</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="info" title="Extended History Endpoint Required">
            The documented Stoplight backend does not provide timestamped historical transaction data or time-series analytics.
            In Demo Mode, this is enabled using simulated data from Mock Service Worker.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Calculate incoming vs outgoing totals
  let incomingSum = 0;
  let outgoingSum = 0;
  const dailyMap = new Map<string, { date: string; incoming: number; outgoing: number }>();

  // Process transactions chronologically
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  sorted.forEach((txn) => {
    const absVal = Math.abs(txn.amount);
    const dateKey = formatShortDate(txn.created_at);

    if (txn.amount > 0) {
      incomingSum += absVal;
    } else {
      outgoingSum += absVal;
    }

    const existing = dailyMap.get(dateKey) || { date: dateKey, incoming: 0, outgoing: 0 };
    if (txn.amount > 0) {
      existing.incoming += absVal;
    } else {
      existing.outgoing += absVal;
    }
    dailyMap.set(dateKey, existing);
  });

  const dailyData = Array.from(dailyMap.values());

  const volumeComparisonData = [
    {
      name: 'Incoming Credits',
      amount: incomingSum,
      fill: '#10b981', // mint green
    },
    {
      name: 'Outgoing Debits',
      amount: outgoingSum,
      fill: '#f43f5e', // muted red
    },
  ];

  return (
    <div className="space-y-6">
      {/* Scope Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600">
        <Info className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-navy-900">Data Scope: </span>
          Computed from active transaction records ({transactions.length} displayed of {totalTransactionsCount} total).
          Outgoing values are represented as positive absolute volumes for chart visualization.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Incoming vs Outgoing Flow */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-brand-600" />
                  Incoming vs. Outgoing Flow
                </CardTitle>
                <CardDescription>Total aggregated transfer volume</CardDescription>
              </div>
              <Badge variant="neutral">Absolute Units</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-[260px]">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
                <BarChart3 className="w-8 h-8 mb-2 opacity-50" />
                No transaction records available to chart.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={volumeComparisonData}
                    margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#475569', fontSize: 12 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#475569', fontSize: 11 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                      tickFormatter={(v) => `${formatNumber(v)}`}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${formatNumber(value)} units`, 'Volume']}
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Quick summary metric cards */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100">
                <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                  Total Incoming
                </div>
                <div className="text-base font-bold text-emerald-900 mt-1 font-mono">
                  +{formatNumber(incomingSum)} units
                </div>
              </div>
              <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-100">
                <div className="flex items-center gap-1.5 text-xs text-rose-800 font-medium">
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                  Total Outgoing
                </div>
                <div className="text-base font-bold text-rose-900 mt-1 font-mono">
                  -{formatNumber(outgoingSum)} units
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Daily Transfer Volume */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  Daily Transfer Activity
                </CardTitle>
                <CardDescription>Volume distribution over time</CardDescription>
              </div>
              <Badge variant="neutral">Timeline</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-[260px]">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : dailyData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
                <Calendar className="w-8 h-8 mb-2 opacity-50" />
                No dated activity found.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={dailyData}
                    margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorOutgoing" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#475569', fontSize: 11 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#475569', fontSize: 11 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                      tickFormatter={(v) => `${formatNumber(v)}`}
                    />
                    <Tooltip
                      formatter={(val: number) => [`${formatNumber(val)} units`]}
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Area
                      type="monotone"
                      dataKey="incoming"
                      name="Incoming"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorIncoming)"
                    />
                    <Area
                      type="monotone"
                      dataKey="outgoing"
                      name="Outgoing"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorOutgoing)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 text-center">
              Timestamps are available via proposed <code className="font-mono">GET /transactions</code> contract adapter.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
