import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ReorderTasksDto } from './dto/reorder-tasks.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly service: TasksService) {}

  @Get()
  @ApiQuery({ name: 'projectId', required: false, type: Number })
  @ApiQuery({ name: 'invoiceId', required: false, type: Number })
  @ApiQuery({ name: 'open', required: false, type: Boolean })
  findAll(
    @CurrentUser() user: User,
    @Query('projectId') projectId?: string,
    @Query('invoiceId') invoiceId?: string,
    @Query('open') open?: string,
  ) {
    return this.service.findAll(user.id, {
      projectId: projectId ? parseInt(projectId, 10) : undefined,
      invoiceId: invoiceId ? parseInt(invoiceId, 10) : undefined,
      open: open === 'true',
    });
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateTaskDto) {
    return this.service.create(user.id, dto);
  }

  @Post('reorder')
  reorder(@Body() dto: ReorderTasksDto) {
    return this.service.reorder(dto.tasks);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(user.id, id);
  }
}
