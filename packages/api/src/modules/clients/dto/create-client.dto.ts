import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vatNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  reverseCharge?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  imageId?: number;
}
