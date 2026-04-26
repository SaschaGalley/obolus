import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { Session, Task, Project, Client } from '../../database/entities';
import { ProjectsModule } from '../projects/projects.module';
import { ClientsModule } from '../clients/clients.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, Task, Project, Client]),
    ProjectsModule,
    ClientsModule,
    TasksModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
