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
import { Client } from './client.entity';
import { Task } from './task.entity';

@Entity('obulus_invoices')
@Index('idx_invoices_client_sent', ['clientId', 'sentAt'])
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'client_id' })
  clientId: number;

  @Column()
  number: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ name: 'calculated_cost', type: 'decimal', precision: 8, scale: 2, default: 0 })
  calculatedCost: number;

  // Eingefrorener Stundensatz der Rechnung. Beim Erstellen aus dem Projektsatz
  // übernommen und auf die stundenbasierten Tasks "eingebrannt" (task.hourly_rate),
  // damit die Rechnung rückwirkend korrekt bleibt, wenn der Projektsatz sich ändert.
  // null = gemischte Sätze (Feld oben zeigt dann Platzhalter).
  @Column({ name: 'hourly_rate', type: 'decimal', precision: 8, scale: 2, nullable: true })
  hourlyRate: number | null;

  @Column({ name: 'client_name', nullable: true })
  clientName: string;

  @Column({ name: 'client_address', type: 'text', nullable: true })
  clientAddress: string;

  @Column({ name: 'client_vat_number', nullable: true })
  clientVatNumber: string;

  @Column({ name: 'reverse_charge', type: 'tinyint', default: 0 })
  reverseCharge: boolean;

  @Column({ type: 'tinyint', default: 0 })
  locked: boolean;

  @Column({ name: 'show_hours', type: 'tinyint', default: 1 })
  showHours: boolean;

  @Column({ name: 'show_date', type: 'tinyint', default: 1 })
  showDate: boolean;

  @Column({ name: 'sent_at', type: 'date', nullable: true })
  sentAt: string;

  // `null` = kein fixes Zahlungsziel → PDF zeigt "Mit der Bitte um Über-
  // weisung nach Erhalt der Rechnung" statt eines konkreten Fälligkeitsdatums.
  @Column({ name: 'due_days', type: 'int', unsigned: true, nullable: true })
  dueDays: number | null;

  @Column({ name: 'payed_at', type: 'date', nullable: true })
  payedAt: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Client, (client) => client.invoices)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @OneToMany(() => Task, (task) => task.invoice)
  tasks: Task[];

  getDueDate(): string | null {
    if (!this.sentAt || this.dueDays == null) return null;
    const sent = new Date(this.sentAt);
    sent.setDate(sent.getDate() + this.dueDays);
    return sent.toISOString().split('T')[0];
  }

  isOverdue(): boolean {
    // No deadline configured → never overdue.
    if (!this.sentAt || this.payedAt || this.dueDays == null) return false;
    const today = new Date().toISOString().split('T')[0];
    return today > this.getDueDate()!;
  }
}
