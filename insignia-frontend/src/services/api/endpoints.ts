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
  UsersQueryFilters,
  UsersListResponseDto,
  UserDetailsResponseDto,
  UpdateUserProfileDto,
  AdminTransferRequestDto,
} from '@/types';

// ==========================================
// 1. Documented Stoplight API Endpoints
// ==========================================

/**
 * Check if a username is already taken
 * GET /user/check-username/:username
 */
export interface CheckUsernameResponse {
  exists: boolean;
  available: boolean;
  message: string;
}

export async function checkUsernameApi(username: string): Promise<CheckUsernameResponse> {
  const response = await apiClient.get<CheckUsernameResponse>(
    `/user/check-username/${encodeURIComponent(username.trim())}`
  );
  return response.data;
}

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

// ==========================================
// 3. User Management Endpoints (/admin/users)
// ==========================================

/**
 * Fetch paginated user profiles with filtering and summary metrics
 * GET /admin/users
 */
export async function getUsersListApi(
  query: UsersQueryFilters = {}
): Promise<UsersListResponseDto> {
  const response = await apiClient.get<UsersListResponseDto>('/admin/users', {
    params: query,
  });
  return response.data;
}

/**
 * Fetch single user biodata, balance metrics, and recent activity
 * GET /admin/users/:idOrUsername
 */
export async function getUserDetailsApi(
  idOrUsername: string
): Promise<UserDetailsResponseDto> {
  const response = await apiClient.get<UserDetailsResponseDto>(
    `/admin/users/${encodeURIComponent(idOrUsername)}`
  );
  return response.data;
}

/**
 * Update user biodata and status
 * PATCH /admin/users/:idOrUsername
 */
export async function updateUserProfileApi(
  idOrUsername: string,
  dto: UpdateUserProfileDto
): Promise<UserDetailsResponseDto> {
  const response = await apiClient.patch<UserDetailsResponseDto>(
    `/admin/users/${encodeURIComponent(idOrUsername)}`,
    dto
  );
  return response.data;
}

/**
 * Admin transfer from user balance
 * POST /admin/users/:idOrUsername/transfer
 */
export async function adminTransferBalanceApi(
  fromUserIdOrUsername: string,
  dto: AdminTransferRequestDto
): Promise<{ success: boolean; transferCode: string; amount: number; senderBalanceAfter: number }> {
  const response = await apiClient.post(
    `/admin/users/${encodeURIComponent(fromUserIdOrUsername)}/transfer`,
    dto
  );
  return response.data;
}

/**
 * Change admin password
 * PATCH /admin/change-password
 */
export async function changePasswordApi(dto: {
  username: string;
  newPassword: string;
  currentPassword?: string;
}): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.patch('/admin/change-password', dto);
  return response.data;
}

/**
 * Get profile for authenticated user/admin
 * GET /admin/profile/:username
 */
export async function getAdminProfileApi(
  username: string
): Promise<UserDetailsResponseDto> {
  const response = await apiClient.get<UserDetailsResponseDto>(
    `/admin/profile/${encodeURIComponent(username)}`
  );
  return response.data;
}

/**
 * Update profile for authenticated user/admin
 * PATCH /admin/profile/:username
 */
export async function updateAdminProfileApi(
  username: string,
  dto: UpdateUserProfileDto
): Promise<any> {
  const response = await apiClient.patch(
    `/admin/profile/${encodeURIComponent(username)}`,
    dto
  );
  return response.data;
}
