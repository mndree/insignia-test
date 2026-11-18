import { ApiProperty } from '@nestjs/swagger';

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
