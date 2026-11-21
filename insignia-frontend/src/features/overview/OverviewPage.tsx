import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Header } from '@/components/layout/Header';
import { BalanceCard } from './BalanceCard';
import { TopupModal } from './TopupModal';
import { TransferModal } from './TransferModal';
import { OverviewCharts } from './OverviewCharts';
import { getBalanceApi, getTransactionsApi } from '@/services/api/endpoints';
import { APP_CONFIG } from '@/app/config';
import { Alert } from '@/components/ui/Alert';
import { normalizeApiError } from '@/services/api/client';

export const OverviewPage: React.FC = () => {
  const outletContext = useOutletContext<{ onOpenSidebar?: () => void }>() || {};
  const onOpenSidebar = outletContext.onOpenSidebar || (() => { });
  const { user } = useAuth();

  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // 1. Fetch current wallet balance
  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    isFetching: isBalanceFetching,
    error: balanceError,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ['balance'],
    queryFn: getBalanceApi,
  });

  // 2. Fetch recent transactions for charts (if available)
  const isHistoryAvailable = APP_CONFIG.isDemoMode || APP_CONFIG.isTransactionsEndpointConfigured;

  const {
    data: transactionsData,
    isLoading: isTransactionsLoading,
    error: transactionsError,
  } = useQuery({
    queryKey: ['transactions', { page: 1, pageSize: 50 }],
    queryFn: () => getTransactionsApi({ page: 1, pageSize: 50 }),
    enabled: isHistoryAvailable,
  });

  const balance = balanceData?.balance ?? 0;

  return (
    <div className="space-y-6">
      <Header
        onOpenSidebar={onOpenSidebar}
        title="Wallet Overview"
        description={`Welcome back, @${user?.username || 'user'}`}
      />

      {balanceError && (
        <Alert variant="error" title="Failed to Load Balance">
          {normalizeApiError(balanceError).message}
        </Alert>
      )}

      {/* Balance Card */}
      <BalanceCard
        balance={balance}
        isLoading={isBalanceLoading}
        isFetching={isBalanceFetching}
        onRefresh={() => refetchBalance()}
        onOpenTopup={() => setIsTopupOpen(true)}
        onOpenTransfer={() => setIsTransferOpen(true)}
        canTopup={user?.role === 'ADMIN'}
      />

      {/* Visual Analytics / Charts */}
      {transactionsError ? (
        <Alert variant="warning" title="Transaction Analytics Notice">
          {normalizeApiError(transactionsError).message}
        </Alert>
      ) : (
        <OverviewCharts
          transactions={transactionsData?.items || []}
          isLoading={isTransactionsLoading}
          isAvailable={isHistoryAvailable}
          totalTransactionsCount={transactionsData?.total || 0}
        />
      )}

      {/* Modals */}
      <TopupModal
        isOpen={isTopupOpen}
        onClose={() => setIsTopupOpen(false)}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        currentBalance={balance}
      />
    </div>
  );
};
