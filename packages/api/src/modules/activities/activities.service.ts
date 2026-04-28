import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  Activity,
  Client,
  Invoice,
  Project,
  Task,
  Session,
} from '../../database/entities';

// Legacy Laravel data stored the table name in `logable_type`
// ('clients', 'projects' …). New entries use the entity name ('Client' …).
// Both are matched here.
const TYPE_ALIASES: Record<string, string[]> = {
  Client: ['Client', 'clients', 'App\\Models\\Client'],
  Project: ['Project', 'projects', 'App\\Models\\Project'],
  Invoice: ['Invoice', 'invoices', 'App\\Models\\Invoice'],
  Task: ['Task', 'tasks', 'App\\Models\\Task'],
  Session: ['Session', 'sessions', 'App\\Models\\Session'],
};

const REVERSE_TYPE: Record<string, string> = {};
for (const [normalized, aliases] of Object.entries(TYPE_ALIASES)) {
  for (const a of aliases) REVERSE_TYPE[a] = normalized;
}

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
  ) {}

  /**
   * Returns the full activity feed for a client: direct activities on the
   * client plus activities on its projects, invoices, tasks and sessions.
   */
  async findForClient(
    userId: number,
    clientId: number,
    page = 1,
    limit = 50,
    onlyTypes?: string[],
  ) {
    const client = await this.clientRepo.findOne({
      where: { id: clientId, userId },
    });
    if (!client) throw new ForbiddenException();

    const projects = await this.projectRepo.find({ where: { clientId } });
    const invoices = await this.invoiceRepo.find({ where: { clientId } });
    const projectIds = projects.map((p) => p.id);
    const invoiceIds = invoices.map((i) => i.id);

    const tasks = projectIds.length
      ? await this.taskRepo.find({ where: { projectId: In(projectIds) } })
      : [];
    const taskIds = tasks.map((t) => t.id);

    const sessions = taskIds.length
      ? await this.sessionRepo.find({ where: { taskId: In(taskIds) } })
      : [];
    const sessionIds = sessions.map((s) => s.id);

    const allFilters: { type: string; ids: number[] }[] = [
      { type: 'Client', ids: [clientId] },
      { type: 'Project', ids: projectIds },
      { type: 'Invoice', ids: invoiceIds },
      { type: 'Task', ids: taskIds },
      { type: 'Session', ids: sessionIds },
    ];

    const filters = onlyTypes
      ? allFilters.filter((f) => onlyTypes.includes(f.type))
      : allFilters;

    const conditions: string[] = [];
    const params: Record<string, any> = {};
    filters.forEach((f, i) => {
      if (!f.ids.length) return;
      const typeParam = `types${i}`;
      const idsParam = `ids${i}`;
      params[typeParam] = TYPE_ALIASES[f.type];
      params[idsParam] = f.ids;
      conditions.push(`(a.logable_type IN (:...${typeParam}) AND a.logable_id IN (:...${idsParam}))`);
    });

    if (!conditions.length) return { data: [], total: 0, page, limit };

    const whereClause = conditions.join(' OR ');

    const total = await this.activityRepo
      .createQueryBuilder('a')
      .where(whereClause, params)
      .getCount();

    const activities = await this.activityRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.user', 'user')
      .where(whereClause, params)
      .orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: activities.map((a) => this.format(a, projects, invoices, tasks, sessions)),
      total,
      page,
      limit,
    };
  }

  private format(
    a: Activity,
    projects: Project[],
    invoices: Invoice[],
    tasks: Task[],
    sessions: Session[],
  ) {
    const normalizedType = this.normalizeType(a.logableType);
    let subjectName: string | null = null;
    let parentTaskId: number | null = null;
    if (normalizedType === 'Project') {
      subjectName = projects.find((p) => p.id === a.logableId)?.name ?? null;
    } else if (normalizedType === 'Invoice') {
      const inv = invoices.find((i) => i.id === a.logableId);
      subjectName = inv ? `Rechnung ${inv.number}` : null;
    } else if (normalizedType === 'Task') {
      subjectName = tasks.find((t) => t.id === a.logableId)?.name ?? null;
    } else if (normalizedType === 'Session') {
      const s = sessions.find((x) => x.id === a.logableId);
      if (s) {
        parentTaskId = s.taskId;
        subjectName = tasks.find((t) => t.id === s.taskId)?.name ?? null;
      }
    }

    let values: any = null;
    if (a.activityValues) {
      try {
        values = JSON.parse(a.activityValues);
      } catch {
        values = a.activityValues;
      }
    }

    return {
      id: a.id,
      createdAt: a.createdAt,
      activityType: a.activityType,
      logableType: normalizedType,
      logableId: a.logableId,
      subjectName,
      parentTaskId,
      values,
      user: a.user
        ? { id: a.user.id, name: a.user.name, email: a.user.email }
        : null,
    };
  }

  private normalizeType(raw: string): string {
    if (REVERSE_TYPE[raw]) return REVERSE_TYPE[raw];
    const lastSegment = raw.split('\\').pop() || raw;
    return REVERSE_TYPE[lastSegment] || lastSegment;
  }
}
