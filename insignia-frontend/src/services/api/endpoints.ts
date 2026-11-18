import { apiClient } from './client';
import { APP_CONFIG } from '@/app/config';
import {
  RegisterUserDto,
  TokenResponseDto,
  BalanceResponseDto,
  TopupDto,
  TransferDto,
  TopTransactionItemDto,
  TopUserItemDto,
  LoginDto,
  LoginResponseDto,
  TransactionsQueryDto,
  PaginatedTransactionsResponseDto,
} from '@/types';

// ==========================================
// 1. Documented Stoplight API Endpoints
// ==========================================

/**
 * Register a new user wallet
 * POST /user
 */
export async function registerUserApi(dto: RegisterUserDto): Promise<TokenResponseDto> {
  const response = await apiClient.post<TokenResponseDto>('/user', dto);
  return response.data;
}

/**
 * Read current wallet balance
 * GET /balance
 */
export async function getBalanceApi(): Promise<BalanceResponseDto> {
  const response = await apiClient.get<BalanceResponseDto>('/balance');
  return response.data;
}

/**
 * Top up wallet balance
 * POST /topup
 */
export async function topupApi(dto: TopupDto): Promise<void> {
  await apiClient.post('/topup', dto);
}

/**
 * Transfer funds to another user
 * POST /transfer
 */
export async function transferApi(dto: TransferDto): Promise<void> {
  await apiClient.post('/transfer', dto);
}

/**
 * Top 10 transfers for authenticated user
 * GET /top_transactions_per_user
 */
export async function getTopTransactionsPerUserApi(): Promise<TopTransactionItemDto[]> {
  const response = await apiClient.get<TopTransactionItemDto[]>('/top_transactions_per_user');
  return response.data;
}

/**
 * Top 10 transacting users across platform
 * GET /top_users
 */
export async function getTopUsersApi(): Promise<TopUserItemDto[]> {
  const response = await apiClient.get<TopUserItemDto[]>('/top_users');
  return response.data;
}

// ==========================================
// 2. Proposed / Extended Endpoints
// ==========================================

/**
 * Authenticate user with username and password
 * POST [configured authLoginPath, default: /auth/login]
 */
export async function loginApi(dto: LoginDto): Promise<LoginResponseDto> {
  if (!APP_CONFIG.authLoginPath) {
    throw new Error('Authentication endpoint is not configured in live mode.');
  }
  const response = await apiClient.post<LoginResponseDto>(APP_CONFIG.authLoginPath, dto);
  return response.data;
}

/**
 * Fetch paginated transaction history with filtering and search
 * GET [configured transactionsPath, default: /transactions]
 */
export async function getTransactionsApi(
  query: TransactionsQueryDto = {}
): Promise<PaginatedTransactionsResponseDto> {
  if (!APP_CONFIG.transactionsPath) {
    throw new Error('Paginated transactions endpoint is not configured.');
  }

  const response = await apiClient.get<PaginatedTransactionsResponseDto>(
    APP_CONFIG.transactionsPath,
    { params: query }
  );
  return response.data;
}
