import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, Client, Project } from '../../database/entities';

// Legacy Laravel data stored the table name in `logable_type`
// ('clients', 'projects' …). New entries use the entity name ('Client' …).
// Both are matched here.
const TYPE_ALIASES = {
  Client: ['Client', 'clients', 'App\\Models\\Client'],
  Project: ['Project', 'projects', 'App\\Models\\Project'],
};

type LogableType = keyof typeof TYPE_ALIASES;

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  /** Activities on the client itself (not its projects, invoices, tasks …). */
  async findForClient(userId: number, clientId: number, page = 1, limit = 50) {
    const client = await this.clientRepo.findOne({
      where: { id: clientId, userId },
    });
    if (!client) throw new ForbiddenException();
    return this.findFor('Client', clientId, page, limit);
  }

  /** Activities on the project itself (not its tasks or sessions). */
  async findForProject(userId: number, projectId: number, page = 1, limit = 50) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId, client: { userId } },
      relations: ['client'],
    });
    if (!project) throw new ForbiddenException();
    return this.findFor('Project', projectId, page, limit);
  }

  private async findFor(type: LogableType, id: number, page: number, limit: number) {
    const [activities, total] = await this.activityRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.user', 'user')
      .where('a.logable_type IN (:...types) AND a.logable_id = :id', {
        types: TYPE_ALIASES[type],
        id,
      })
      .orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: activities.map((a) => this.format(a)),
      total,
      page,
      limit,
    };
  }

  private format(a: Activity) {
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
      values,
      user: a.user
        ? { id: a.user.id, name: a.user.name, email: a.user.email }
        : null,
    };
  }
}
