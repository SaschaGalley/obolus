import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { ActivityLoggerService } from './activity-logger.service';
import { Activity, Client, Project } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, Client, Project])],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, ActivityLoggerService],
  exports: [ActivityLoggerService],
})
export class ActivitiesModule {}
