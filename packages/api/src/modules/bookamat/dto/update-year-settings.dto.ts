import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

/**
 * Coerce strings → numbers (e.g. when the form re-sends loaded DB DECIMAL
 * values like "10977.00", or when the user pastes formatted numbers).
 * Empty strings, `null`, `undefined` all collapse to `null` so that
 * `@IsOptional()` accepts them and the controller can clear the column.
 */
const toNumOrNull = ({ value }: { value: unknown }): number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    // Tolerate German locale formatting: "1.234,56" → 1234.56
    const cleaned = value.replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

/**
 * Partial update of a YearSettings row. All fields are optional; the
 * controller patches only the keys actually present in the request body.
 *
 * Every field has `@Transform(toNumOrNull)` so the DTO accepts both the
 * canonical `number` form and stringy variants (DB strings, locale-formatted
 * input). Validation then runs against the coerced numeric value.
 */
export class UpdateYearSettingsDto {
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsInt() @Min(1)
  activeMonths?: number;

  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsNumber() gehalt?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsNumber() umsatzErwartet?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsNumber() ausgabenErwartet?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsNumber() sonstigeEinnahmen?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsNumber() sonderausgaben?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsNumber() gewinnmindernde_ausgaben?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsNumber() absetzbeitrag?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsNumber() kapitalvermoegen?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsNumber() anspruchszinsen?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsNumber() svsVorschreibungPv?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsNumber() svsVorschreibungKv?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsNumber() svsHoechstbeitragsgrundlage?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsNumber() svsPensionsversicherung?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsNumber() svsKrankenversicherung?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsNumber() svsVorsorge?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsNumber() svsUnfallversicherung?: number;

  // Nullable fields: DB allows null (= "not yet assessed by FA"), so the
  // user can clear them via the UI. `@IsOptional()` lets null pass through.
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsNumber() svsNachbemessen?: number | null;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsNumber() estVorschreibung?: number | null;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsNumber() estFestgesetzt?: number | null;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsNumber() ustFestgesetzt?: number | null;

  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsInt() estLimit1?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsInt() estLimit2?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsInt() estLimit3?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsInt() estLimit4?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsInt() estLimit5?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumOrNull) @IsInt() estLimit6?: number;
}
