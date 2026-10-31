import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../../database/entities';
import { ReconcileService } from './reconcile.service';
import { IgnoreDto, LinkDto, TransferDto } from './dto';

@ApiTags('Bookamat')
@ApiBearerAuth()
@Controller('bookamat/reconcile')
export class ReconcileController {
  constructor(private readonly service: ReconcileService) {}

  /** Open/done/ignored counts per month. */
  @Get(':year')
  year(@CurrentUser() user: User, @Param('year', ParseIntPipe) year: number) {
    return this.service.year(user.id, year);
  }

  /** The month's movements, each with its booking or a filled-in Bookamat form. */
  @Get(':year/:month')
  month(
    @CurrentUser() user: User,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.service.month(user.id, year, month);
  }

  /** Bookings around the month no movement claims yet, to link one by hand. */
  @Get(':year/:month/unmatched-bookings')
  unmatchedBookings(
    @CurrentUser() user: User,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.service.unmatchedBookings(user.id, year, month);
  }

  @Post('transfer')
  transfer(@CurrentUser() user: User, @Body() dto: TransferDto) {
    return this.service.transfer(user.id, dto);
  }

  @Post('link')
  link(@CurrentUser() user: User, @Body() dto: LinkDto) {
    return this.service.link(user.id, dto.umsatzId, dto.bookamatId);
  }

  @Post('ignore')
  ignore(@CurrentUser() user: User, @Body() dto: IgnoreDto) {
    return this.service.ignore(user.id, dto.umsatzId, dto.ignored);
  }

  @Delete('decisions/:umsatzId')
  reset(@CurrentUser() user: User, @Param('umsatzId') umsatzId: string) {
    return this.service.reset(user.id, umsatzId);
  }

  /** Re-read Umsatz on the next request, e.g. after importing a statement. */
  @Post('refresh')
  refresh() {
    return this.service.refresh();
  }
}
