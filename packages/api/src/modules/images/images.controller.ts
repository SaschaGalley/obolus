import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Res,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { join } from 'path';
import { Response } from 'express';
import { uploadStorage } from '../../common/upload.storage';
import { ImagesService } from './images.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Images')
@ApiBearerAuth()
@Controller()
export class ImagesController {
  constructor(private readonly service: ImagesService) {}

  @Get('images')
  findAll(@CurrentUser() user: User) {
    return this.service.findAll(user.id);
  }

  @Post('images')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: uploadStorage }))
  upload(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File) {
    return this.service.upload(user.id, file);
  }

  @Delete('images/:id')
  remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(user.id, id);
  }

  @Public()
  @Get('uploads/:filename')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    return res.sendFile(filename, { root: join(process.cwd(), 'uploads') });
  }
}
