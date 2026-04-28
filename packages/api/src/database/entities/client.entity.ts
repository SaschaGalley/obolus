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
import { User } from './user.entity';
import { Project } from './project.entity';
import { Invoice } from './invoice.entity';
import { Image } from './image.entity';

@Entity('obulus_clients')
@Index('idx_clients_user_archived', ['userId', 'archived'])
@Index('idx_clients_user_name', ['userId', 'name'])
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'vat_number', nullable: true })
  vatNumber: string;

  @Column({ name: 'reverse_charge', type: 'tinyint', default: 0 })
  reverseCharge: boolean;

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

  @ManyToOne(() => User, (user) => user.clients)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Project, (project) => project.client)
  projects: Project[];

  @OneToMany(() => Invoice, (invoice) => invoice.client)
  invoices: Invoice[];

  @ManyToOne(() => Image)
  @JoinColumn({ name: 'image_id' })
  image: Image;

  getHourlyRate(): number {
    return this.hourlyRate ? Number(this.hourlyRate) : 65;
  }
}
