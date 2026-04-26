import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { Invoice, Expense, Task } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Expense, Task])],
  controllers: [AccountingController],
  providers: [AccountingService],
})
export class AccountingModule {}
