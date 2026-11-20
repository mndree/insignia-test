import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, IsString, IsIn } from 'class-validator';

export class TransactionsQueryDto {
  @ApiPropertyOptional({ default: 1, description: 'Page number (1-based)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, description: 'Page size' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: 'Search term for transaction ID, counterparty, or notes' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['all', 'incoming', 'outgoing'], description: 'Filter by transaction direction' })
  @IsOptional()
  @IsIn(['all', 'incoming', 'outgoing'])
  direction?: 'all' | 'incoming' | 'outgoing' = 'all';

  @ApiPropertyOptional({ description: 'Filter transactions from date (ISO string)' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter transactions to date (ISO string)' })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Sort by field: id, username, amount, createdAt, description' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], description: 'Sort order: asc or desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
