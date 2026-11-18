import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { OverviewPage } from '@/features/overview/OverviewPage';
import { TransactionsPage } from '@/features/transactions/TransactionsPage';
import { TopTransactionsPage } from '@/features/top-transactions/TopTransactionsPage';
import { TopUsersPage } from '@/features/top-users/TopUsersPage';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Dashboard Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="top-transactions" element={<TopTransactionsPage />} />
        <Route path="top-users" element={<TopUsersPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
