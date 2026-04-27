import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, Task, Session, Project, Client } from '../../database/entities';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { ActivityLoggerService } from '../activities/activity-logger.service';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  async findAll(userId: number) {
    const invoices = await this.invoiceRepo
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.client', 'client')
      .leftJoinAndSelect('invoice.tasks', 'task')
      .leftJoinAndSelect('task.sessions', 'session')
      .leftJoinAndSelect('task.project', 'project')
      .where('client.user_id = :userId', { userId })
      .orderBy('CASE WHEN invoice.sent_at IS NULL THEN 0 ELSE 1 END', 'ASC')
      .addOrderBy('invoice.sent_at', 'DESC')
      .addOrderBy('invoice.created_at', 'DESC')
      .getMany();

    return invoices.map((inv) => this.getInvoiceWithCalculations(inv));
  }

  async findOne(userId: number, id: number) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['client', 'tasks', 'tasks.project', 'tasks.project.client', 'tasks.sessions'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.client.userId !== userId) throw new ForbiddenException();
    return this.getInvoiceWithCalculations(invoice);
  }

  async create(userId: number, dto: CreateInvoiceDto) {
    const client = await this.clientRepo.findOne({
      where: { id: dto.clientId, userId },
    });
    if (!client) throw new NotFoundException('Client not found');

    const invoice = this.invoiceRepo.create({
      clientId: dto.clientId,
      number: dto.number,
      note: dto.note,
      sentAt: dto.sentAt,
      dueDays: dto.dueDays ?? 14,
      payedAt: dto.payedAt,
      showHours: dto.showHours ?? true,
      showDate: dto.showDate ?? true,
      reverseCharge: dto.reverseCharge ?? client.reverseCharge,
      clientName: dto.clientName || client.name,
      clientAddress: dto.clientAddress || client.address,
      clientVatNumber: dto.clientVatNumber || client.vatNumber,
    });

    const saved = await this.invoiceRepo.save(invoice);

    // If projectId provided, assign unbilled usable tasks from that project
    if (dto.projectId) {
      const project = await this.projectRepo.findOne({
        where: { id: dto.projectId },
        relations: ['client'],
      });
      if (project && project.client.userId === userId) {
        await this.taskRepo
          .createQueryBuilder()
          .update(Task)
          .set({ invoiceId: saved.id })
          .where('project_id = :projectId', { projectId: dto.projectId })
          .andWhere('invoice_id IS NULL')
          .andWhere('use = 1')
          .execute();
      }
    } else {
      // No projectId: assign all unbilled usable tasks from all projects of this client
      const clientProjects = await this.projectRepo.find({
        where: { clientId: dto.clientId },
      });
      const projectIds = clientProjects.map(p => p.id);
      if (projectIds.length > 0) {
        await this.taskRepo
          .createQueryBuilder()
          .update(Task)
          .set({ invoiceId: saved.id })
          .where('project_id IN (:...projectIds)', { projectIds })
          .andWhere('invoice_id IS NULL')
          .andWhere('use = 1')
          .execute();
      }
    }

    // Calculate cost from assigned tasks
    await this.recalculateCost(saved.id);

    await this.activityLogger.log(userId, 'Invoice', saved.id, 'created');

    return this.findOne(userId, saved.id);
  }

  async update(userId: number, id: number, dto: UpdateInvoiceDto) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['client'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.client.userId !== userId) throw new ForbiddenException();

    const dirty: Record<string, any> = {};
    const fields: (keyof UpdateInvoiceDto)[] = [
      'number', 'note', 'sentAt', 'dueDays', 'payedAt', 'showHours',
      'showDate', 'reverseCharge', 'clientName', 'clientAddress', 'clientVatNumber',
    ];
    for (const f of fields) {
      if (dto[f] !== undefined && (invoice as any)[f] !== dto[f]) {
        dirty[f] = { from: (invoice as any)[f], to: dto[f] };
        (invoice as any)[f] = dto[f];
      }
    }

    await this.invoiceRepo.save(invoice);
    await this.recalculateCost(id);

    if (Object.keys(dirty).length > 0) {
      await this.activityLogger.log(userId, 'Invoice', id, 'updated', dirty);
    }

    return this.findOne(userId, id);
  }

  async remove(userId: number, id: number) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['client', 'tasks', 'tasks.project'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.client.userId !== userId) throw new ForbiddenException();

    // Get affected project/client IDs before unassigning
    const affectedProjectIds = [...new Set((invoice.tasks || []).map(t => t.projectId))];

    // Unassign tasks
    await this.taskRepo
      .createQueryBuilder()
      .update(Task)
      .set({ invoiceId: undefined as any })
      .where('invoice_id = :invoiceId', { invoiceId: id })
      .execute();

    await this.invoiceRepo.remove(invoice);

    // Recalculate affected projects and client
    for (const projectId of affectedProjectIds) {
      const unbilledTasks = await this.taskRepo
        .createQueryBuilder('task')
        .leftJoinAndSelect('task.sessions', 'session')
        .leftJoinAndSelect('task.project', 'project')
        .leftJoinAndSelect('project.client', 'client')
        .where('task.project_id = :projectId', { projectId })
        .andWhere('task.invoice_id IS NULL')
        .andWhere('task.use = 1')
        .getMany();

      const billedTasks = await this.taskRepo
        .createQueryBuilder('task')
        .leftJoinAndSelect('task.sessions', 'session')
        .leftJoinAndSelect('task.project', 'project')
        .leftJoinAndSelect('project.client', 'client')
        .where('task.project_id = :projectId', { projectId })
        .andWhere('task.invoice_id IS NOT NULL')
        .andWhere('task.use = 1')
        .getMany();

      const unbilledCost = unbilledTasks.reduce((sum, t) => sum + this.calcTaskCost(t), 0);
      const unbilledDuration = unbilledTasks.reduce((sum, t) => sum + this.calcTaskDuration(t), 0);
      const billedCost = billedTasks.reduce((sum, t) => sum + this.calcTaskCost(t), 0);
      const billedDuration = billedTasks.reduce((sum, t) => sum + this.calcTaskDuration(t), 0);

      await this.projectRepo.update(projectId, {
        unbilledCost, unbilledDuration, billedCost, billedDuration,
        totalCost: unbilledCost + billedCost,
        totalDuration: unbilledDuration + billedDuration,
      });
    }

    await this.activityLogger.log(userId, 'Invoice', id, 'deleted');

    // Recalculate client
    if (invoice.clientId) {
      const clientProjects = await this.projectRepo.find({ where: { clientId: invoice.clientId } });
      let clientUnbilledCost = 0, clientUnbilledDuration = 0, clientBilledCost = 0, clientBilledDuration = 0;
      for (const p of clientProjects) {
        clientUnbilledCost += Number(p.unbilledCost) || 0;
        clientUnbilledDuration += Number(p.unbilledDuration) || 0;
        clientBilledCost += Number(p.billedCost) || 0;
        clientBilledDuration += Number(p.billedDuration) || 0;
      }
      await this.clientRepo.update(invoice.clientId, {
        unbilledCost: clientUnbilledCost, unbilledDuration: clientUnbilledDuration,
        billedCost: clientBilledCost, billedDuration: clientBilledDuration,
        totalCost: clientUnbilledCost + clientBilledCost,
        totalDuration: clientUnbilledDuration + clientBilledDuration,
      });
    }
  }

  private async recalculateCost(invoiceId: number) {
    const tasks = await this.taskRepo.find({
      where: { invoiceId },
      relations: ['sessions', 'project', 'project.client'],
    });

    const totalCost = tasks
      .filter((t) => t.use)
      .reduce((sum, task) => {
        const cost = this.calcTaskCost(task);
        return sum + cost;
      }, 0);

    await this.invoiceRepo.update(invoiceId, { calculatedCost: totalCost });
  }

  private calcTaskDuration(task: Task): number {
    if (task.fixedDuration) return Number(task.fixedDuration);
    return (task.sessions || [])
      .filter((s) => s.use)
      .reduce((sum, s) => sum + Number(s.duration), 0);
  }

  private calcTaskCost(task: Task): number {
    if (task.fixedCost) return Number(task.fixedCost);
    const duration = this.calcTaskDuration(task);
    const rate = task.hourlyRate
      ? Number(task.hourlyRate)
      : task.project?.hourlyRate
        ? Number(task.project.hourlyRate)
        : task.project?.client?.hourlyRate
          ? Number(task.project.client.hourlyRate)
          : 65;
    return duration * rate;
  }

  private getInvoiceWithCalculations(invoice: Invoice) {
    const tasks = invoice.tasks || [];
    const usableTasks = tasks.filter((t) => t.use);

    const cost = usableTasks.reduce((sum, task) => sum + this.calcTaskCost(task), 0);
    const duration = usableTasks.reduce((sum, task) => sum + this.calcTaskDuration(task), 0);
    const tax = invoice.reverseCharge ? 0 : cost * 0.2;
    const total = cost + tax;
    const dueDate = invoice.getDueDate();

    let status: string;
    if (invoice.payedAt) {
      status = 'payed';
    } else if (!invoice.sentAt) {
      status = 'in_progress';
    } else if (invoice.isOverdue()) {
      status = 'overdue';
    } else {
      status = 'unpayed';
    }

    return {
      ...invoice,
      cost,
      duration,
      tax,
      total,
      dueDate,
      status,
    };
  }
}
