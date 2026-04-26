import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities';

@ApiTags('Search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get()
  @ApiQuery({ name: 'query', required: true, type: String })
  search(
    @CurrentUser() user: User,
    @Query('query') query: string,
  ) {
    return this.service.search(user.id, query);
  }
}
