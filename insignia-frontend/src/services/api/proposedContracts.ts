/**
 * ============================================================================
 * PROPOSED EXTENDED BACKEND CONTRACTS
 * ============================================================================
 * 
 * DISCLAIMER:
 * These contracts are PROPOSED to bridge the technical test functional requirements
 * (username/password login, paginated transaction history, search/filter, and charts)
 * with the supplied Stoplight wallet specification, which only provides:
 *   - POST /user (username only, returns token)
 *   - GET /balance
 *   - POST /topup
 *   - POST /transfer
 *   - GET /top_transactions_per_user (top 10 absolute transfers)
 *   - GET /top_users (top 10 outgoing senders)
 * 
 * In Demo Mode, these proposed endpoints are fully simulated by Mock Service Worker (MSW).
 * In Live Mode, the frontend connects to these paths only if configured in environment
 * variables (VITE_AUTH_LOGIN_PATH, VITE_TRANSACTIONS_PATH). If unconfigured, the UI
 * gracefully displays an unavailable contract notice.
 */

import {
  LoginDto,
  LoginResponseDto,
  TransactionsQueryDto,
  PaginatedTransactionsResponseDto,
} from '@/types';

export const PROPOSED_CONTRACT_SPECS = {
  /**
   * PROPOSED: User Authentication Login
   * Method: POST
   * Default Path: /auth/login (or /admin/login)
   */
  login: {
    method: 'POST',
    path: '/auth/login',
    summary: 'Authenticate user with username and password, returning session token',
    requestBodySample: {
      username: 'admin',
      password: '...',
    } as LoginDto,
    responseSample: {
      token: 'jwt-or-opaque-token-string',
      user: {
        username: 'admin',
      },
    } as LoginResponseDto,
    statusCodes: {
      200: 'Authenticated successfully',
      400: 'Validation error (missing username or password)',
      401: 'Invalid username or password',
    },
  },

  /**
   * PROPOSED: Paginated Transaction History with Filter and Search
   * Method: GET
   * Default Path: /transactions
   */
  transactions: {
    method: 'GET',
    path: '/transactions',
    summary: 'Retrieve paginated user transaction history with search and filtering',
    queryParameters: {
      page: 'Page number (default: 1)',
      pageSize: 'Items per page: 10, 25, 50 (default: 10)',
      search: 'Search substring matching counterparty username or transaction ID',
      direction: 'Filter by transfer direction: "all" | "incoming" | "outgoing"',
      dateFrom: 'ISO 8601 start date timestamp',
      dateTo: 'ISO 8601 end date timestamp',
    } as Record<keyof TransactionsQueryDto, string>,
    responseSample: {
      items: [
        {
          id: 'txn-001',
          username: 'azra',
          amount: -250,
          created_at: '2026-11-18T08:30:00Z',
          description: 'Payment for services',
        },
        {
          id: 'txn-002',
          username: 'system',
          amount: 1000,
          created_at: '2026-11-18T09:15:00Z',
          description: 'Balance top-up',
        },
      ],
      page: 1,
      pageSize: 10,
      total: 42,
    } as PaginatedTransactionsResponseDto,
    statusCodes: {
      200: 'Transactions retrieved successfully',
      401: 'Unauthorized - valid token required in Authorization header',
    },
  },
} as const;
