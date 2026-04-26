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
  Res,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PdfService } from '../../pdf/pdf.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly service: ProjectsService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  @ApiQuery({ name: 'show', required: false, enum: ['active', 'archived', 'all'] })
  @ApiQuery({ name: 'clientId', required: false, type: Number })
  findAll(
    @CurrentUser() user: User,
    @Query('show') show?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.service.findAll(user.id, {
      show: show || 'active',
      clientId: clientId ? parseInt(clientId, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateProjectDto) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(user.id, id);
  }

  @Get(':id/quote')
  @ApiQuery({ name: 'title', required: false })
  @ApiQuery({ name: 'showHours', required: false })
  async getQuote(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Query('title') title?: string,
    @Query('showHours') showHours?: string,
    @Res() res?: Response,
  ) {
    // Verify access
    await this.service.findOne(user.id, id);
    const buffer = await this.pdfService.generateQuotePdf(id, {
      title,
      showHours: showHours !== 'false',
    });
    res!.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="angebot-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res!.end(buffer);
  }

  @Post(':id/recalculate')
  recalculate(@Param('id', ParseIntPipe) id: number) {
    return this.service.recalculate(id);
  }
}
