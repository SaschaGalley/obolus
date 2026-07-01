import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty()
  @IsNumber()
  clientId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  projectId?: number;

  @ApiProperty()
  @IsString()
  number: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sentAt?: string;

  // `null` (oder weggelassen) = kein Zahlungsziel → PDF zeigt
  // "Mit der Bitte um Überweisung nach Erhalt …" statt Fälligkeitsdatum.
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  dueDays?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payedAt?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  showHours?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  showDate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  reverseCharge?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientVatNumber?: string;

  // Rechnungs-Stundensatz. Beim Bearbeiten setzt er den Satz auf allen
  // stundenbasierten Tasks der Rechnung (Override) und friert sie ein.
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  hourlyRate?: number | null;
}
