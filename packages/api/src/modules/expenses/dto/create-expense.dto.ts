import { IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseType } from '../../../database/entities';

export class CreateExpenseDto {
  @ApiProperty()
  @IsNumber()
  cost: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  tax?: number;

  @ApiPropertyOptional({ enum: ExpenseType, default: ExpenseType.OTHER })
  @IsOptional()
  @IsEnum(ExpenseType)
  type?: ExpenseType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payedAt?: string;
}
