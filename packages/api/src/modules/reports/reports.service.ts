import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, Invoice } from '../../database/entities';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  async getPayingHabit(userId: number) {
    const clients = await this.clientRepo.find({
      where: { userId },
    });

    const results: Array<{
      clientId: number;
      clientName: string;
      inTime: number;
      overdue: number;
      avg: number;
      median: number;
    }> = [];

    for (const client of clients) {
      const invoices = await this.invoiceRepo.find({
        where: {
          clientId: client.id,
        },
      });

      const payedInvoices = invoices.filter(
        (inv) => inv.payedAt !== null && inv.sentAt !== null,
      );

      if (payedInvoices.length === 0) {
        continue;
      }

      const daysArray: number[] = [];
      let inTime = 0;
      let overdue = 0;

      for (const inv of payedInvoices) {
        const sentDate = new Date(inv.sentAt);
        const payedDate = new Date(inv.payedAt);
        const diffMs = payedDate.getTime() - sentDate.getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        daysArray.push(days);

        if (days <= inv.dueDays) {
          inTime++;
        } else {
          overdue++;
        }
      }

      const avg = Math.floor(
        daysArray.reduce((sum, d) => sum + d, 0) / daysArray.length,
      );

      const sorted = [...daysArray].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = Math.floor(
        sorted.length % 2 !== 0
          ? sorted[mid]
          : (sorted[mid - 1] + sorted[mid]) / 2,
      );

      results.push({
        clientId: client.id,
        clientName: client.name,
        inTime,
        overdue,
        avg,
        median,
      });
    }

    return results;
  }
}
