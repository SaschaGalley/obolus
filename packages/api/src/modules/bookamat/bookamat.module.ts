import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking, YearSettings, User } from '../../database/entities';
import { BookamatController } from './bookamat.controller';
import { BookamatService } from './bookamat.service';
import { BookamatClient } from './bookamat.client';
import { OverviewService } from './overview.service';
import { BookamatScheduler } from './bookamat.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, YearSettings, User])],
  controllers: [BookamatController],
  providers: [BookamatClient, BookamatService, OverviewService, BookamatScheduler],
})
export class BookamatModule {}
