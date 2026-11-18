import { DataMode } from '@/types';

/**
 * Centralized Application Configuration
 * Guarantees environment variable parsing and consistent fallbacks.
 */
export const APP_CONFIG = {
  dataMode: (import.meta.env.VITE_DATA_MODE as DataMode) || 'demo',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  authLoginPath: import.meta.env.VITE_AUTH_LOGIN_PATH || '/auth/login',
  transactionsPath: import.meta.env.VITE_TRANSACTIONS_PATH || '/transactions',
  isDemoMode: (import.meta.env.VITE_DATA_MODE || 'demo') === 'demo',
  isLiveMode: import.meta.env.VITE_DATA_MODE === 'live',
  isTransactionsEndpointConfigured: Boolean(import.meta.env.VITE_TRANSACTIONS_PATH),
  isAuthLoginEndpointConfigured: Boolean(import.meta.env.VITE_AUTH_LOGIN_PATH),
} as const;
