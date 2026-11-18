import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class TransferDto {
  @ApiProperty({ example: 'bob', description: 'Username of the recipient' })
  @IsString()
  @IsNotEmpty()
  to_username: string;

  @ApiProperty({ example: 25, description: 'Amount to transfer' })
  @IsNumber()
  @IsPositive()
  amount: number;
}
