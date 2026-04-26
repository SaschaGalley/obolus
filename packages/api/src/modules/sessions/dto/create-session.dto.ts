import { IsNumber, IsOptional, IsBoolean, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty()
  @IsNumber()
  taskId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startedAt?: Date;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  use?: boolean;
}
