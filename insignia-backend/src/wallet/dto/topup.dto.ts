import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class TopupDto {
  @ApiProperty({ example: 100, description: 'Amount to add to balance' })
  @IsNumber()
  @IsPositive()
  amount: number;
}
