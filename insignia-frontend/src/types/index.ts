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
  role?: 'ADMIN' | 'USER';
  id?: string;
  fullName?: string;
}

// ==========================================
// 1. Documented Stoplight API Contracts
// ==========================================

export interface RegisterUserDto {
  username: string;
  password?: string;
  fullName?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  address?: string;
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
  role?: 'ADMIN' | 'USER';
  user?: {
    id?: string;
    username: string;
    fullName?: string;
    role?: 'ADMIN' | 'USER';
  };
  admin?: {
    id: string;
    username: string;
    fullName?: string;
  } | null;
}

export interface UserProfileDto {
  id: string;
  userCode: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  balance: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface UpdateUserProfileDto {
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
}

export type TransactionDirection = 'all' | 'incoming' | 'outgoing';

export interface TransactionsQueryDto {
  page?: number;
  pageSize?: number;
  search?: string;
  direction?: TransactionDirection;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
// 3. User Management Models (Users List & Detail)
// ==========================================

export interface UserListItemDto {
  id: string;
  userCode: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  status: 'Active' | 'Inactive';
  balance: number;
  createdAt: string;
  lastLoginAt: string;
}

export interface UserStatsDto {
  totalUsers: number;
  activeUsers: number;
  totalWalletBalance: number;
}

export interface UsersQueryFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UsersListResponseDto {
  items: UserListItemDto[];
  page: number;
  pageSize: number;
  total: number;
  stats: UserStatsDto;
}

export interface UserRecentTransactionDto {
  id: string;
  counterparty: string;
  counterpartyName?: string;
  direction: 'incoming' | 'outgoing';
  amount: number; // Signed: positive for incoming, negative for outgoing
  createdAt: string;
  notes?: string;
}

export interface UserDetailsResponseDto {
  id: string;
  userCode: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  status: 'Active' | 'Inactive';
  balance: number;
  createdAt: string;
  lastLoginAt: string;
  stats: {
    availableBalance: number;
    totalReceived: number;
    totalSent: number;
  };
  recentTransactions: UserRecentTransactionDto[];
}

export interface UpdateUserProfileDto {
  userCode?: string;
  username?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  status?: 'Active' | 'Inactive';
  balance?: number;
  password?: string;
}

export interface AdminTransferRequestDto {
  to_username: string;
  amount: number;
  notes?: string;
}

// ==========================================
// 4. UI Models & Analytics Summaries
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
