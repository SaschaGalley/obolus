import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { Client, Project, Task, Session } from '../../database/entities';
import { ActivitiesModule } from '../activities/activities.module';
import { ImagesModule } from '../images/images.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, Project, Task, Session]),
    ActivitiesModule,
    ImagesModule,
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
