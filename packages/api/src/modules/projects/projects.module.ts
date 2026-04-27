import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { PdfModule } from '../../pdf/pdf.module';
import { Project, Task, Session, Client } from '../../database/entities';
import { ActivitiesModule } from '../activities/activities.module';
import { ImagesModule } from '../images/images.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Task, Session, Client]),
    PdfModule,
    ActivitiesModule,
    ImagesModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
