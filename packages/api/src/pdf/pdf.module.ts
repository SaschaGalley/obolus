import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfService } from './pdf.service';
import { Invoice, Task, Session, Project, Client } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Task, Session, Project, Client])],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
