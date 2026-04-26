import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export type LogableType = 'Client' | 'Project' | 'Invoice' | 'Task' | 'Session';

@Entity('obulus_activity')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'logable_id' })
  logableId: number;

  @Column({ name: 'logable_type' })
  logableType: string;

  @Column({ name: 'activity_type' })
  activityType: string;

  @Column({ name: 'activity_values', type: 'text', nullable: true })
  activityValues: string;

  @Column({ name: 'user_id' })
  userId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
