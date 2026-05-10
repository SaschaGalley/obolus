import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookamatService } from './bookamat.service';
import { OverviewService } from './overview.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, YearSettings } from '../../database/entities';
import { UpdateYearSettingsDto } from './dto/update-year-settings.dto';

@ApiTags('Bookamat')
@ApiBearerAuth()
@Controller('bookamat')
export class BookamatController {
  constructor(
    private readonly service: BookamatService,
    private readonly overview: OverviewService,
    @InjectRepository(YearSettings)
    private readonly yearSettingsRepo: Repository<YearSettings>,
  ) {}

  /** Multi-year overview – the data behind the /accounting page. */
  @Get('overview')
  getOverview(@CurrentUser() user: User) {
    return this.overview.build(user.id);
  }

  /** Sync every year from BOOKAMAT_STARTING_YEAR to currentYear. */
  @Post('sync')
  syncAll(@CurrentUser() user: User) {
    return this.service.syncAll(user.id);
  }

  /** Sync a single year. Used when the user clicks a column header. */
  @Post('sync/:year')
  syncYear(@CurrentUser() user: User, @Param('year', ParseIntPipe) year: number) {
    return this.service.syncYear(user.id, year);
  }

  /** Raw bookings (for drilldown / debugging). */
  @Get('bookings')
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  listBookings(
    @CurrentUser() user: User,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.service.listBookings(user.id, {
      year: year ? parseInt(year, 10) : undefined,
      month: month ? parseInt(month, 10) : undefined,
    });
  }

  /** All year settings rows for the current user. */
  @Get('settings')
  listSettings(@CurrentUser() user: User) {
    return this.yearSettingsRepo.find({ where: { userId: user.id }, order: { year: 'ASC' } });
  }

  /** Update settings for one year. Creates the row if missing. */
  @Patch('settings/:year')
  async updateSettings(
    @CurrentUser() user: User,
    @Param('year', ParseIntPipe) year: number,
    @Body() dto: UpdateYearSettingsDto,
  ) {
    const existing = await this.yearSettingsRepo.findOne({ where: { userId: user.id, year } });
    if (!existing) {
      // Auto-create with defaults, then patch.
      await this.yearSettingsRepo.insert({ userId: user.id, year });
    }
    await this.yearSettingsRepo.update({ userId: user.id, year }, dto as Partial<YearSettings>);
    const updated = await this.yearSettingsRepo.findOne({ where: { userId: user.id, year } });
    if (!updated) throw new NotFoundException('Year settings not found');
    return updated;
  }
}
