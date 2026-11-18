/**
 * Data Mode configuration
 */
export type DataMode = 'demo' | 'live';

/**
 * Authenticated User Session
 */
export interface AuthUser {
  username: string;
  token: string;
}

// ==========================================
// 1. Documented Stoplight API Contracts
// ==========================================

export interface RegisterUserDto {
  username: string;
}

export interface TokenResponseDto {
  token: string;
}

export interface BalanceResponseDto {
  balance: number;
}

export interface TopupDto {
  amount: number;
}

export interface TransferDto {
  to_username: string;
  amount: number;
}

/**
 * Item returned by GET /top_transactions_per_user
 * Signed: negative for outgoing, positive for incoming
 */
export interface TopTransactionItemDto {
  username: string;
  amount: number;
}

/**
 * Item returned by GET /top_users
 * transacted_value represents aggregated outgoing transfer value (positive number)
 */
export interface TopUserItemDto {
  username: string;
  transacted_value: number;
}

// ==========================================
// 2. Proposed Extended Contracts (Documented Gaps)
// ==========================================

export interface LoginDto {
  username: string;
  password?: string;
}

export interface LoginResponseDto {
  token: string;
  user?: {
    username: string;
  };
}

export type TransactionDirection = 'all' | 'incoming' | 'outgoing';

export interface TransactionsQueryDto {
  page?: number;
  pageSize?: number;
  search?: string;
  direction?: TransactionDirection;
  dateFrom?: string;
  dateTo?: string;
}

export interface TransactionRecordDto {
  id: string;
  username: string; // Counterparty username
  amount: number;   // Signed: positive for incoming, negative for outgoing
  created_at: string;
  description?: string;
}

export interface PaginatedTransactionsResponseDto {
  items: TransactionRecordDto[];
  page: number;
  pageSize: number;
  total: number;
}

// ==========================================
// 3. UI Models & Analytics Summaries
// ==========================================

export interface TransactionSummaryStats {
  incomingTotal: number;
  outgoingTotal: number;
  netFlow: number;
  transactionCount: number;
}

export interface DailyVolumeDataPoint {
  date: string;
  incoming: number;
  outgoing: number; // positive absolute volume for charting
}
