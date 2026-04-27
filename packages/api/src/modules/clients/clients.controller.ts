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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { uploadStorage } from '../../common/upload.storage';
import { User } from '../../database/entities';

@ApiTags('Clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Get()
  @ApiQuery({ name: 'show', required: false, enum: ['active', 'archived', 'all'] })
  findAll(@CurrentUser() user: User, @Query('show') show?: string) {
    return this.service.findAll(user.id, show || 'active');
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateClientDto) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClientDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(user.id, id);
  }

  @Post(':id/picture')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: uploadStorage }))
  uploadPicture(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadPicture(user.id, id, file);
  }

  @Post(':id/recalculate')
  recalculate(@Param('id', ParseIntPipe) id: number) {
    return this.service.recalculate(id);
  }
}
