import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Client } from './client.entity';
import { Task } from './task.entity';
import { Image } from './image.entity';

@Entity('obulus_projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'client_id' })
  clientId: number;

  @Column()
  name: string;

  @Column({ name: 'hourly_rate', type: 'decimal', precision: 6, scale: 2, nullable: true })
  hourlyRate: number;

  @Column({ name: 'image_id', nullable: true })
  imageId: number;

  @Column({ nullable: true })
  picture: string;

  @Column({ type: 'tinyint', default: 0 })
  archived: boolean;

  @Column({ name: 'unbilled_cost', type: 'decimal', precision: 8, scale: 2, default: 0 })
  unbilledCost: number;

  @Column({ name: 'unbilled_duration', type: 'decimal', precision: 8, scale: 2, default: 0 })
  unbilledDuration: number;

  @Column({ name: 'billed_cost', type: 'decimal', precision: 8, scale: 2, default: 0 })
  billedCost: number;

  @Column({ name: 'billed_duration', type: 'decimal', precision: 8, scale: 2, default: 0 })
  billedDuration: number;

  @Column({ name: 'total_cost', type: 'decimal', precision: 8, scale: 2, default: 0 })
  totalCost: number;

  @Column({ name: 'total_duration', type: 'decimal', precision: 8, scale: 2, default: 0 })
  totalDuration: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Client, (client) => client.projects)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @OneToMany(() => Task, (task) => task.project)
  tasks: Task[];

  @ManyToOne(() => Image)
  @JoinColumn({ name: 'image_id' })
  image: Image;

  getHourlyRate(): number {
    if (this.hourlyRate) return Number(this.hourlyRate);
    if (this.client) return this.client.getHourlyRate();
    return 65;
  }
}
