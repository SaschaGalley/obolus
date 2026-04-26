import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  @ApiQuery({ name: 'year', required: false, type: Number })
  getStats(
    @CurrentUser() user: User,
    @Query('year') year?: string,
  ) {
    return this.service.getStats(user.id, year ? parseInt(year, 10) : undefined);
  }
}
