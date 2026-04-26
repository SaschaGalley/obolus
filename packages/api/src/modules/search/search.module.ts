import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Client, Project, Invoice } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Client, Project, Invoice])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
