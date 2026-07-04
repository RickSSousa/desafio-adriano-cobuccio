import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const DEFAULT_TRANSACTIONS_PAGE_SIZE = 5;

export class ListTransactionsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: DEFAULT_TRANSACTIONS_PAGE_SIZE, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  take: number = DEFAULT_TRANSACTIONS_PAGE_SIZE;

  @ApiPropertyOptional({ description: 'Filter by description, type, status or amount' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({ description: 'Start date (inclusive), format YYYY-MM-DD' })
  @IsOptional()
  @IsDateString({ strict: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (inclusive), format YYYY-MM-DD' })
  @IsOptional()
  @IsDateString({ strict: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  endDate?: string;
}
