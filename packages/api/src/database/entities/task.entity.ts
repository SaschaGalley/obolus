import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Project } from './project.entity';
import { Invoice } from './invoice.entity';
import { Session } from './session.entity';

@Entity('obulus_tasks')
@Index('idx_tasks_project_use_invoice', ['projectId', 'use', 'invoiceId'])
@Index('idx_tasks_invoice', ['invoiceId'])
@Index('idx_tasks_project_order', ['projectId', 'order'])
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id' })
  projectId: number;

  @Column({ name: 'invoice_id', nullable: true })
  invoiceId: number;

  @Column({ length: 1024 })
  name: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ name: 'hourly_rate', type: 'decimal', precision: 8, scale: 2, nullable: true })
  hourlyRate: number;

  @Column({ name: 'fixed_cost', type: 'decimal', precision: 8, scale: 2, nullable: true })
  fixedCost: number;

  @Column({ name: 'fixed_duration', type: 'decimal', precision: 8, scale: 2, nullable: true })
  fixedDuration: number;

  @Column({ name: 'fixed_date', type: 'date', nullable: true })
  fixedDate: string;

  @Column({ type: 'int', unsigned: true, nullable: true })
  order: number;

  @Column({ name: 'use', type: 'tinyint', default: 1 })
  use: boolean;

  @Column({ type: 'tinyint', default: 0 })
  locked: boolean;

  @Column({ name: 'calculated_cost', type: 'decimal', precision: 8, scale: 2, default: 0 })
  calculatedCost: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Project, (project) => project.tasks)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Invoice, (invoice) => invoice.tasks, { nullable: true })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @OneToMany(() => Session, (session) => session.task)
  sessions: Session[];
}
