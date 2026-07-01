import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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

  async getNextNumber(userId: number): Promise<{ number: string }> {
    const currentYear = new Date().getFullYear();

    // Filter by current year and sort by number DESC so zero-padded lexicographic
    // order matches numeric order (001 < 009 < 010 < 100).
    const lastInvoice = await this.invoiceRepo
      .createQueryBuilder('invoice')
      .leftJoin('invoice.client', 'client')
      .where('client.user_id = :userId', { userId })
      .andWhere('invoice.number LIKE :pattern', { pattern: `%/${currentYear}` })
      .orderBy('invoice.number', 'DESC')
      .select(['invoice.id', 'invoice.number'])
      .getOne();

    if (!lastInvoice?.number) {
      return { number: `001/${currentYear}` };
    }

    const match = lastInvoice.number.match(/^(\d+)\/(\d{4})$/);
    if (!match) {
      return { number: `001/${currentYear}` };
    }

    const lastSeq = parseInt(match[1], 10);
    const next = String(lastSeq + 1).padStart(match[1].length, '0');
    return { number: `${next}/${currentYear}` };
  }

  async findAll(userId: number, page = 1, limit = 20, clientId?: number, projectId?: number) {
    const qb = this.invoiceRepo
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.client', 'client')
      .where('client.user_id = :userId', { userId });

    if (clientId) {
      qb.andWhere('invoice.client_id = :clientId', { clientId });
    }
    if (projectId) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM obulus_tasks t WHERE t.invoice_id = invoice.id AND t.project_id = :projectId)`,
        { projectId },
      );
    }

    const total = await qb.getCount();

    // Do NOT join tasks/sessions here — the list only needs invoice header fields.
    // calculatedCost is already maintained on every task/session mutation.
    const dataQb = this.invoiceRepo
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.client', 'client')
      .where('client.user_id = :userId', { userId })
      .addSelect('CASE WHEN invoice.sent_at IS NULL THEN 0 ELSE 1 END', 'sort_unsent')
      .orderBy('sort_unsent', 'ASC')
      .addOrderBy('invoice.sentAt', 'DESC')
      .addOrderBy('invoice.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (clientId) {
      dataQb.andWhere('invoice.client_id = :clientId', { clientId });
    }
    if (projectId) {
      dataQb.andWhere(
        `EXISTS (SELECT 1 FROM obulus_tasks t WHERE t.invoice_id = invoice.id AND t.project_id = :projectId)`,
        { projectId },
      );
    }

    const invoices = await dataQb.getMany();

    return {
      data: invoices.map((inv) => ({
        ...inv,
        dueDate: inv.getDueDate(),
      })),
      total,
      page,
      limit,
    };
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
      // null = "kein fixes Zahlungsziel" (Default für neue Rechnungen).
      dueDays: dto.dueDays === undefined ? null : dto.dueDays,
      payedAt: dto.payedAt,
      showHours: dto.showHours ?? true,
      showDate: dto.showDate ?? true,
      reverseCharge: dto.reverseCharge ?? client.reverseCharge,
      clientName: dto.clientName || client.name,
      clientAddress: dto.clientAddress || client.address,
      clientVatNumber: dto.clientVatNumber || client.vatNumber,
    });

    const saved = await this.invoiceRepo.save(invoice);

    // Track which projects had tasks reassigned, so we can refresh their
    // cached unbilled/billed aggregates after the bulk UPDATE.
    let affectedProjectIds: number[] = [];

    if (dto.projectId) {
      const project = await this.projectRepo.findOne({
        where: { id: dto.projectId },
        relations: ['client'],
      });
      if (project && project.client.userId === userId) {
        if (project.status === 'quoted') {
          throw new BadRequestException(
            'Rechnung kann nicht für ein Projekt im Status "Angeboten" erstellt werden. Bitte zuerst auf "Laufend" setzen.',
          );
        }
        await this.taskRepo
          .createQueryBuilder()
          .update(Task)
          .set({ invoiceId: saved.id })
          .where('project_id = :projectId', { projectId: dto.projectId })
          .andWhere('invoice_id IS NULL')
          .andWhere('is_active = 1')
          .execute();
        affectedProjectIds = [dto.projectId];
      }
    } else {
      // No projectId: assign all unbilled usable tasks from all NON-QUOTED
      // projects of this client. Quoted projects hold offer estimates only.
      const clientProjects = await this.projectRepo.find({
        where: { clientId: dto.clientId },
      });
      const projectIds = clientProjects.filter(p => p.status !== 'quoted').map(p => p.id);
      if (projectIds.length > 0) {
        await this.taskRepo
          .createQueryBuilder()
          .update(Task)
          .set({ invoiceId: saved.id })
          .where('project_id IN (:...projectIds)', { projectIds })
          .andWhere('invoice_id IS NULL')
          .andWhere('is_active = 1')
          .execute();
        affectedProjectIds = projectIds;
      }
    }

    // Rechnungs-Satz einfrieren: den effektiven Satz (Projekt/Kunde) auf die
    // verrechneten Stunden-Tasks pinnen, damit die Rechnung bei späteren
    // Projektsatz-Änderungen unverändert bleibt. Wertneutral (Satz = aktueller
    // effektiver Satz), setzt zusätzlich den Anzeige-Satz der Rechnung.
    await this.freezeInvoiceRates(saved.id, dto.hourlyRate ?? undefined);

    // Calculate cost from assigned tasks
    await this.recalculateCost(saved.id);

    // Bugfix: the bulk task UPDATE above moved tasks from "unbilled" to
    // "billed" on these projects, but their cached aggregates (and the
    // client's) still reflect the pre-invoice state. Refresh them now so
    // the projects table / client overview shows the correct unbilled
    // cost immediately after invoice creation.
    for (const projectId of affectedProjectIds) {
      await this.recalculateProject(projectId);
    }
    await this.recalculateClient(dto.clientId);

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

    // Rechnungs-Stundensatz geändert → auf alle stundenbasierten Tasks der
    // Rechnung anwenden (Override) und die betroffenen Projekt-/Kunden-Aggregate
    // auffrischen, da sich die verrechneten Kosten ändern.
    if (dto.hourlyRate !== undefined && dto.hourlyRate !== null) {
      const rate = Number(dto.hourlyRate);
      if (!Number.isNaN(rate) && rate !== Number(invoice.hourlyRate)) {
        dirty.hourlyRate = { from: invoice.hourlyRate, to: rate };
        await this.applyInvoiceRate(id, rate);
        const rows = await this.taskRepo.manager.query<any[]>(
          `SELECT DISTINCT project_id AS pid FROM obulus_tasks WHERE invoice_id = ?`,
          [id],
        );
        for (const r of rows) await this.recalculateProject(Number(r.pid));
        await this.recalculateClient(invoice.clientId);
      }
    }

    await this.recalculateCost(id);

    if (Object.keys(dirty).length > 0) {
      await this.activityLogger.log(userId, 'Invoice', id, 'updated', dirty);
    }

    return this.findOne(userId, id);
  }

  async remove(userId: number, id: number) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['client', 'tasks'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.client.userId !== userId) throw new ForbiddenException();

    const affectedProjectIds = [...new Set((invoice.tasks || []).map(t => t.projectId))];
    const clientId = invoice.clientId;

    // Unassign tasks then delete
    await this.taskRepo
      .createQueryBuilder()
      .update(Task)
      .set({ invoiceId: undefined as any })
      .where('invoice_id = :invoiceId', { invoiceId: id })
      .execute();

    await this.invoiceRepo.remove(invoice);
    await this.activityLogger.log(userId, 'Invoice', id, 'deleted');

    // Recalculate affected projects via SQL aggregate (no task/session objects loaded)
    for (const projectId of affectedProjectIds) {
      await this.recalculateProject(projectId);
    }

    // Recalculate client from project aggregates
    if (clientId) {
      await this.recalculateClient(clientId);
    }
  }

  private async recalculateCost(invoiceId: number) {
    // Use the per-task calculated_cost which is already kept in sync on every
    // task/session mutation — no need to load tasks or sessions into Node.js.
    const [row] = await this.taskRepo.manager.query<any[]>(
      `SELECT COALESCE(SUM(calculated_cost), 0) AS total
       FROM obulus_tasks WHERE invoice_id = ? AND is_active = 1`,
      [invoiceId],
    );
    await this.invoiceRepo.update(invoiceId, { calculatedCost: Number(row.total) || 0 });
  }

  /**
   * Friert den Stundensatz einer Rechnung auf ihren Tasks ein.
   * - explicitRate gesetzt (z.B. Nutzer gibt Satz vor): Override auf ALLEN
   *   stundenbasierten Tasks.
   * - sonst: den effektiven Satz (Projekt ?? Kunde ?? 65) auf Tasks OHNE eigenen
   *   Satz "einbrennen" (wertneutral). Danach Anzeige-Satz der Rechnung setzen.
   * Fixkosten-Tasks bleiben unberührt.
   */
  private async freezeInvoiceRates(invoiceId: number, explicitRate?: number) {
    if (explicitRate !== undefined && explicitRate !== null && !Number.isNaN(Number(explicitRate))) {
      await this.applyInvoiceRate(invoiceId, Number(explicitRate));
      return;
    }
    await this.taskRepo.manager.query(
      `UPDATE obulus_tasks t
         JOIN obulus_projects p ON p.id = t.project_id
         JOIN obulus_clients c ON c.id = p.client_id
         LEFT JOIN (SELECT task_id, SUM(duration) dur FROM obulus_sessions WHERE is_active = 1 GROUP BY task_id) s
           ON s.task_id = t.id
       SET t.hourly_rate = COALESCE(p.hourly_rate, c.hourly_rate, 65),
           t.calculated_cost = COALESCE(t.fixed_duration, s.dur, 0) * COALESCE(p.hourly_rate, c.hourly_rate, 65)
       WHERE t.invoice_id = ? AND t.is_active = 1 AND t.fixed_cost IS NULL AND t.hourly_rate IS NULL`,
      [invoiceId],
    );
    // Anzeige-Satz: nur wenn alle stundenbasierten Tasks denselben Satz haben.
    await this.taskRepo.manager.query(
      `UPDATE obulus_invoices inv
         JOIN (
           SELECT invoice_id, MIN(hourly_rate) mn, MAX(hourly_rate) mx
           FROM obulus_tasks
           WHERE invoice_id = ? AND is_active = 1 AND fixed_cost IS NULL AND hourly_rate IS NOT NULL
           GROUP BY invoice_id
         ) r ON r.invoice_id = inv.id
       SET inv.hourly_rate = r.mn
       WHERE inv.id = ? AND r.mn = r.mx`,
      [invoiceId, invoiceId],
    );
  }

  /**
   * Setzt einen Stundensatz per Override auf alle stundenbasierten Tasks der
   * Rechnung (fixe Kosten bleiben) und speichert ihn als Rechnungs-Satz.
   */
  private async applyInvoiceRate(invoiceId: number, rate: number) {
    await this.taskRepo.manager.query(
      `UPDATE obulus_tasks t
         LEFT JOIN (SELECT task_id, SUM(duration) dur FROM obulus_sessions WHERE is_active = 1 GROUP BY task_id) s
           ON s.task_id = t.id
       SET t.hourly_rate = ?, t.calculated_cost = COALESCE(t.fixed_duration, s.dur, 0) * ?
       WHERE t.invoice_id = ? AND t.is_active = 1 AND t.fixed_cost IS NULL`,
      [rate, rate, invoiceId],
    );
    await this.invoiceRepo.update(invoiceId, { hourlyRate: rate });
  }

  private calcTaskDuration(task: Task): number {
    if (task.fixedDuration) return Number(task.fixedDuration);
    return (task.sessions || [])
      .filter((s) => s.isActive)
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
    const usableTasks = tasks.filter((t) => t.isActive);

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

  private async recalculateProject(projectId: number) {
    const [row] = await this.taskRepo.manager.query<any[]>(
      `SELECT
        COALESCE(SUM(CASE WHEN t.invoice_id IS NULL  AND t.is_active = 1 THEN t.calculated_cost END), 0) AS unbilledCost,
        COALESCE(SUM(CASE WHEN t.invoice_id IS NOT NULL AND t.is_active = 1 THEN t.calculated_cost END), 0) AS billedCost,
        COALESCE(SUM(CASE WHEN t.invoice_id IS NULL  AND t.is_active = 1
          THEN COALESCE(t.fixed_duration, s_agg.dur, 0) END), 0) AS unbilledDuration,
        COALESCE(SUM(CASE WHEN t.invoice_id IS NOT NULL AND t.is_active = 1
          THEN COALESCE(t.fixed_duration, s_agg.dur, 0) END), 0) AS billedDuration
       FROM obulus_tasks t
       LEFT JOIN (SELECT task_id, SUM(duration) AS dur FROM obulus_sessions WHERE is_active = 1 GROUP BY task_id) s_agg
         ON s_agg.task_id = t.id
       WHERE t.project_id = ?`,
      [projectId],
    );
    const u = Number(row.unbilledCost) || 0;
    const b = Number(row.billedCost)   || 0;
    const ud = Number(row.unbilledDuration) || 0;
    const bd = Number(row.billedDuration)   || 0;
    await this.projectRepo.update(projectId, {
      unbilledCost: u, billedCost: b, unbilledDuration: ud, billedDuration: bd,
      totalCost: u + b, totalDuration: ud + bd,
    });
  }

  private async recalculateClient(clientId: number) {
    const [row] = await this.taskRepo.manager.query<any[]>(
      `SELECT
        COALESCE(SUM(CASE WHEN t.invoice_id IS NULL  AND t.is_active = 1 THEN t.calculated_cost END), 0) AS unbilledCost,
        COALESCE(SUM(CASE WHEN t.invoice_id IS NOT NULL AND t.is_active = 1 THEN t.calculated_cost END), 0) AS billedCost,
        COALESCE(SUM(CASE WHEN t.invoice_id IS NULL  AND t.is_active = 1
          THEN COALESCE(t.fixed_duration, s_agg.dur, 0) END), 0) AS unbilledDuration,
        COALESCE(SUM(CASE WHEN t.invoice_id IS NOT NULL AND t.is_active = 1
          THEN COALESCE(t.fixed_duration, s_agg.dur, 0) END), 0) AS billedDuration
       FROM obulus_tasks t
       INNER JOIN obulus_projects p ON p.id = t.project_id
       LEFT JOIN (SELECT task_id, SUM(duration) AS dur FROM obulus_sessions WHERE is_active = 1 GROUP BY task_id) s_agg
         ON s_agg.task_id = t.id
       WHERE p.client_id = ? AND p.status <> 'quoted'`,
      [clientId],
    );
    const u = Number(row.unbilledCost) || 0;
    const b = Number(row.billedCost)   || 0;
    const ud = Number(row.unbilledDuration) || 0;
    const bd = Number(row.billedDuration)   || 0;
    await this.clientRepo.update(clientId, {
      unbilledCost: u, billedCost: b, unbilledDuration: ud, billedDuration: bd,
      totalCost: u + b, totalDuration: ud + bd,
    });
  }
}
