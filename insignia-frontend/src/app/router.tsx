import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { OverviewPage } from '@/features/overview/OverviewPage';
import { UsersListPage } from '@/features/users/UsersListPage';
import { UserDetailsPage } from '@/features/users/UserDetailsPage';
import { TransactionsPage } from '@/features/transactions/TransactionsPage';
import { TopTransactionsPage } from '@/features/top-transactions/TopTransactionsPage';
import { TopUsersPage } from '@/features/top-users/TopUsersPage';
import { MyProfilePage } from '@/features/profile/MyProfilePage';

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
        <Route path="profile" element={<MyProfilePage />} />
        <Route path="transactions" element={<TransactionsPage />} />

        {/* Admin Only Routes */}
        <Route
          path="users"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <UsersListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/:id"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <UserDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="top-transactions"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <TopTransactionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="top-users"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <TopUsersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
