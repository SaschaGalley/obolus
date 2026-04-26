import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Client, Project, Invoice } from '../../database/entities';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  async search(userId: number, query: string) {
    const pattern = `%${query}%`;

    const clients = await this.clientRepo.find({
      where: { userId, name: Like(pattern) },
    });

    const projects = await this.projectRepo
      .createQueryBuilder('project')
      .innerJoin('project.client', 'client')
      .where('client.userId = :userId', { userId })
      .andWhere('project.name LIKE :pattern', { pattern })
      .getMany();

    const invoices = await this.invoiceRepo
      .createQueryBuilder('invoice')
      .innerJoin('invoice.client', 'client')
      .where('client.userId = :userId', { userId })
      .andWhere('invoice.number LIKE :pattern', { pattern })
      .getMany();

    return { clients, projects, invoices };
  }
}
