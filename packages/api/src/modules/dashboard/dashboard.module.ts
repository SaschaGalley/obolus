import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Client, Invoice, Task, Project } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Client, Invoice, Task, Project])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
