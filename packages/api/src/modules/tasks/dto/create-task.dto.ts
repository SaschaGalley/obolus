import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty()
  @IsNumber()
  projectId: number;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  fixedCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  fixedDuration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fixedDate?: string;
}
