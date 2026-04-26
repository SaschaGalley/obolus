import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task, Session, Project, Client } from '../../database/entities';
import { ProjectsModule } from '../projects/projects.module';
import { ClientsModule } from '../clients/clients.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Session, Project, Client]),
    ProjectsModule,
    ClientsModule,
    ActivitiesModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
