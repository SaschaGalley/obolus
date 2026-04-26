import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Client, Invoice } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Client, Invoice])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
