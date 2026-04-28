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
import { Task } from './task.entity';

@Entity('obulus_sessions')
@Index('idx_sessions_task', ['taskId'])
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'task_id' })
  taskId: number;

  @Column({ name: 'started_at', type: 'datetime' })
  startedAt: Date;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  duration: number;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ name: 'use', type: 'tinyint', default: 1 })
  use: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Task, (task) => task.sessions)
  @JoinColumn({ name: 'task_id' })
  task: Task;
}
