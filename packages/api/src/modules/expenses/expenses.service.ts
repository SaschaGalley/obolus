import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense, ExpenseType } from '../../database/entities';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
  ) {}

  async findAll(userId: number) {
    return this.expenseRepo.find({
      where: { userId },
      order: { payedAt: 'DESC' },
    });
  }

  async findOne(userId: number, id: number) {
    const expense = await this.expenseRepo.findOne({
      where: { id, userId },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async create(userId: number, dto: CreateExpenseDto) {
    const expense = this.expenseRepo.create({
      userId,
      cost: dto.cost,
      tax: dto.tax,
      type: dto.type || ExpenseType.OTHER,
      note: dto.note,
      payedAt: dto.payedAt,
    });
    return this.expenseRepo.save(expense);
  }

  async update(userId: number, id: number, dto: UpdateExpenseDto) {
    const expense = await this.findOne(userId, id);
    Object.assign(expense, {
      ...(dto.cost !== undefined && { cost: dto.cost }),
      ...(dto.tax !== undefined && { tax: dto.tax }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.note !== undefined && { note: dto.note }),
      ...(dto.payedAt !== undefined && { payedAt: dto.payedAt }),
    });
    return this.expenseRepo.save(expense);
  }

  async remove(userId: number, id: number) {
    const expense = await this.findOne(userId, id);
    await this.expenseRepo.remove(expense);
  }
}
