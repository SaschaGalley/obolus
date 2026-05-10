import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

/**
 * Partial update of a YearSettings row. All fields are optional – the
 * controller patches only the keys actually present in the request body.
 */
export class UpdateYearSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) activeMonths?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() gehalt?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() umsatzErwartet?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() ausgabenErwartet?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() sonstigeEinnahmen?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() sonderausgaben?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() gewinnmindernde_ausgaben?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() absetzbeitrag?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() kapitalvermoegen?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() anspruchszinsen?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() svsVorschreibungPv?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() svsVorschreibungKv?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() svsHoechstbeitragsgrundlage?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() svsPensionsversicherung?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() svsKrankenversicherung?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() svsVorsorge?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() svsUnfallversicherung?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() svsNachbemessen?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() estVorschreibung?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() estFestgesetzt?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() ustFestgesetzt?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() estLimit1?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() estLimit2?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() estLimit3?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() estLimit4?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() estLimit5?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() estLimit6?: number;
}
