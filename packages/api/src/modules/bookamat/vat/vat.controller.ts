import { BadRequestException, Controller, Get, Param, ParseIntPipe, Query, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../../database/entities';
import { VatService } from './vat.service';
import { buildVatWorkbook } from './vat.xlsx';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@ApiTags('Bookamat')
@ApiBearerAuth()
@Controller('bookamat/vat')
export class VatController {
  constructor(private readonly service: VatService) {}

  /** UVA and ZM of every period of a year, with the lines behind them. */
  @Get(':year')
  report(@CurrentUser() user: User, @Param('year', ParseIntPipe) year: number) {
    return this.service.report(user.id, year);
  }

  /** Excel file of one period (`Q3`, `M07`) or of the year (`year`). */
  @Get(':year/export')
  @ApiQuery({ name: 'period', required: true, example: 'Q3' })
  async export(
    @CurrentUser() user: User,
    @Param('year', ParseIntPipe) year: number,
    @Query('period') period: string,
  ): Promise<StreamableFile> {
    if (!/^(Q[1-4]|M(0[1-9]|1[0-2])|year)$/.test(period ?? '')) {
      throw new BadRequestException('period muss Q1–Q4, M01–M12 oder year sein.');
    }
    const report = await this.service.report(user.id, year);
    if (period !== 'year' && !report.periods.some((p) => p.key === period)) {
      throw new BadRequestException(`Den Zeitraum ${period} gibt es bei ${report.settings.vatPeriod === 'month' ? 'monatlicher' : 'vierteljährlicher'} UVA nicht.`);
    }
    const file = await buildVatWorkbook(report, period);
    const name = period === 'year' ? `UVA-ZM-${year}.xlsx` : `UVA-ZM-${year}-${period}.xlsx`;
    return new StreamableFile(file, { type: XLSX, disposition: `attachment; filename="${name}"` });
  }
}
