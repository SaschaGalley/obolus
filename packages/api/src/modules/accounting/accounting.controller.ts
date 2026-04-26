import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities';

@ApiTags('Accounting')
@ApiBearerAuth()
@Controller('accounting')
export class AccountingController {
  constructor(private readonly service: AccountingService) {}

  @Get()
  @ApiQuery({ name: 'year', required: false, type: Number })
  getOverview(
    @CurrentUser() user: User,
    @Query('year') year?: string,
  ) {
    return this.service.getOverview(user.id, year ? parseInt(year, 10) : undefined);
  }
}
