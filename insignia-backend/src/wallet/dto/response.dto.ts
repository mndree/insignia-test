import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Authentication token' })
  token: string;
}

export class BalanceResponseDto {
  @ApiProperty({ example: 100, description: 'Current user balance' })
  balance: number;
}

export class TransactionItemDto {
  @ApiProperty({ example: 'bob', description: 'Counterparty username' })
  username: string;

  @ApiProperty({ example: -25, description: 'Amount relative to the user (negative for outgoing, positive for incoming)' })
  amount: number;
}

export class TopUserItemDto {
  @ApiProperty({ example: 'alice', description: 'Username of user with outgoing transfers' })
  username: string;

  @ApiProperty({ example: 25, description: 'Sum of successful outgoing transfers' })
  transacted_value: number;
}

export class TransactionRecordDto {
  @ApiProperty({ example: 'TXN-9021', description: 'Unique transaction code' })
  id: string;

  @ApiProperty({ example: 'azra', description: 'Counterparty username' })
  username: string;

  @ApiProperty({ example: -2500, description: 'Signed amount: positive for incoming, negative for outgoing' })
  amount: number;

  @ApiProperty({ example: '2026-11-18T10:45:00.000Z', description: 'Transaction creation timestamp' })
  created_at: string;

  @ApiPropertyOptional({ example: 'Project payment', description: 'Transaction notes or memo' })
  description?: string;
}

export class PaginatedTransactionsResponseDto {
  @ApiProperty({ type: [TransactionRecordDto] })
  items: TransactionRecordDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  pageSize: number;

  @ApiProperty({ example: 128 })
  total: number;
}
