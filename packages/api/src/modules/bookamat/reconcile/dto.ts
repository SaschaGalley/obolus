import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, MaxLength, Min, Max, ValidateNested,
} from 'class-validator';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** One amount line, accounts by their Bookamat name (resolved to the year's IDs on transfer). */
export class TransferAmountDto {
  @ApiProperty() @IsString() bankaccount: string;
  @ApiProperty() @IsString() costaccount: string;
  @ApiProperty() @IsString() purchasetaxaccount: string;
  @ApiProperty() @IsNumber() @Min(0.01) amount: number;
  @ApiProperty() @IsNumber() @Min(0) @Max(100) taxPercent: number;
  @ApiProperty() @IsNumber() @Min(0) @Max(100) deductibilityTaxPercent: number;
  @ApiProperty() @IsNumber() @Min(0) @Max(100) deductibilityAmountPercent: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(4) countryDep?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(4) countryRec?: string | null;
}

export class TransferBookingDto {
  @ApiProperty() @IsString() @MaxLength(50) title: string;
  @ApiProperty() @Matches(DAY) date: string;
  @ApiPropertyOptional() @IsOptional() @Matches(DAY) dateInvoice?: string | null;
  @ApiPropertyOptional() @IsOptional() @Matches(DAY) dateDelivery?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) vatin?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(4) country?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() costcentre?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) description?: string | null;

  @ApiProperty({ type: [TransferAmountDto] })
  @ValidateNested({ each: true })
  @Type(() => TransferAmountDto)
  amounts: TransferAmountDto[];
}

export class AttachmentDto {
  @ApiProperty() @IsString() @MaxLength(120) name: string;
  /** The file, base64-encoded. */
  @ApiProperty() @IsString() data: string;
}

export class TransferDto {
  @ApiProperty() @IsString() umsatzId: string;

  /** `book` = gebucht; `open` = offene Buchung ohne Zahlungsdatum, zum Prüfen in Bookamat. */
  @ApiProperty({ enum: ['book', 'open'] }) @IsIn(['book', 'open']) mode: 'book' | 'open';

  /** Only build the request and return it, send nothing. */
  @ApiPropertyOptional() @IsOptional() @IsBoolean() dryRun?: boolean;

  @ApiProperty({ type: TransferBookingDto })
  @ValidateNested()
  @Type(() => TransferBookingDto)
  booking: TransferBookingDto;

  /** The obolus invoice the payment settles. */
  @ApiPropertyOptional() @IsOptional() @IsInt() invoiceId?: number;
  /** Attach the invoice's PDF to the booking. */
  @ApiPropertyOptional() @IsOptional() @IsBoolean() attachInvoice?: boolean;
  /** Set the invoice's payment date to the booking's. */
  @ApiPropertyOptional() @IsOptional() @IsBoolean() markInvoicePaid?: boolean;

  @ApiPropertyOptional({ type: AttachmentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AttachmentDto)
  attachment?: AttachmentDto;
}

export class LinkDto {
  @ApiProperty() @IsString() umsatzId: string;
  @ApiProperty() @IsInt() bookamatId: number;
}

export class IgnoreDto {
  @ApiProperty() @IsString() umsatzId: string;
  @ApiProperty() @IsBoolean() ignored: boolean;
}
