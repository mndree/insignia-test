import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { WalletService } from './wallet.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { TopupDto } from './dto/topup.dto.js';
import { TransferDto } from './dto/transfer.dto.js';
import {
  TokenResponseDto,
  BalanceResponseDto,
  TransactionItemDto,
  TopUserItemDto,
  PaginatedTransactionsResponseDto,
} from './dto/response.dto.js';
import { TransactionsQueryDto } from './dto/transactions-query.dto.js';

@ApiTags('Wallet API')
@ApiBearerAuth('admin-token')
@ApiHeader({
  name: 'Authorization',
  description: 'Bearer token (e.g. "Bearer <token>" or direct token; can also be set via the Authorize button)',
  required: false,
})
@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  @Post(['user', 'register'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Username already taken' })
  register(@Body() dto: RegisterUserDto): Promise<TokenResponseDto> {
    return this.walletService.register(dto);
  }

  @Get(['user/check-username/:username', 'check-username/:username'])
  @ApiOperation({ summary: 'Check if username is already registered' })
  @ApiResponse({
    status: 200,
    description: 'Availability check result with exists and available booleans',
  })
  checkUsername(@Param('username') username: string) {
    return this.walletService.checkUsername(username);
  }

  @Post('topup')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Top up user balance' })
  @ApiResponse({ status: 204, description: 'Balance topped up successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  topup(
    @CurrentUser() user: User,
    @Body() dto: TopupDto,
  ): Promise<void> {
    return this.walletService.topup(user, dto);
  }

  @Get('balance')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Read current user balance' })
  @ApiResponse({
    status: 200,
    description: 'Current user balance',
    type: BalanceResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getBalance(@CurrentUser() user: User): Promise<BalanceResponseDto> {
    return this.walletService.getBalance(user.id);
  }

  @Post('transfer')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Transfer funds to another user' })
  @ApiResponse({ status: 204, description: 'Transfer executed successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or invalid transfer' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Recipient user not found' })
  transfer(
    @CurrentUser() user: User,
    @Body() dto: TransferDto,
  ): Promise<void> {
    return this.walletService.transfer(user, dto);
  }

  @Get('top_transactions_per_user')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Top transfers for current user sorted by absolute amount' })
  @ApiResponse({
    status: 200,
    description: 'Top transfers for user',
    type: [TransactionItemDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getTopTransactionsPerUser(
    @CurrentUser() user: User,
  ): Promise<TransactionItemDto[]> {
    return this.walletService.getTopTransactionsPerUser(user);
  }

  @Get('top_users')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List overall top transacting users by outgoing transfer value' })
  @ApiResponse({
    status: 200,
    description: 'Top transacting users by outgoing value',
    type: [TopUserItemDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getTopUsers(): Promise<TopUserItemDto[]> {
    return this.walletService.getTopUsers();
  }

  @Get('transactions')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch paginated transaction history with filtering and search' })
  @ApiResponse({
    status: 200,
    description: 'Paginated transactions list',
    type: PaginatedTransactionsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getTransactions(
    @CurrentUser() user: User,
    @Query() query: TransactionsQueryDto,
  ): Promise<PaginatedTransactionsResponseDto> {
    return this.walletService.getTransactions(user, query);
  }
}
