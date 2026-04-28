import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum ExpenseType {
  OTHER = 'other',
  SVA = 'sva',
  UST = 'ust',
  EST = 'est',
}

@Entity('obulus_expenses')
@Index('idx_expenses_user_payed', ['userId', 'payedAt'])
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  cost: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  tax: number;

  @Column({ type: 'enum', enum: ExpenseType, default: ExpenseType.OTHER })
  type: ExpenseType;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ name: 'payed_at', type: 'date', nullable: true })
  payedAt: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.expenses)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
