import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, Project, Task } from '../../database/entities';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ActivityLoggerService } from '../activities/activity-logger.service';
import { ImagesService } from '../images/images.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly activityLogger: ActivityLoggerService,
    private readonly imagesService: ImagesService,
  ) {}

  async findAll(userId: number, filters: { show?: string; clientId?: number; page?: number; limit?: number } = {}) {
    const { page = 1, limit = 20 } = filters;
    const qb = this.projectRepo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.client', 'client')
      .leftJoinAndSelect('project.image', 'image')
      .where('client.user_id = :userId', { userId })
      .orderBy('project.name', 'ASC');

    if (filters.show === 'active') {
      qb.andWhere('project.archived = 0');
      qb.andWhere('client.archived = 0');
    } else if (filters.show === 'archived') {
      qb.andWhere('(project.archived = 1 OR client.archived = 1)');
    }

    if (filters.clientId) {
      qb.andWhere('project.client_id = :clientId', { clientId: filters.clientId });
    }

    const [projects, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: projects.map(p => ({
        ...p,
        total: Number(p.totalCost) || 0,
        unbilled: Number(p.unbilledCost) || 0,
        billed: Number(p.billedCost) || 0,
        clientName: p.client?.name || '',
        hourlyRate: p.getHourlyRate(),
      })),
      total,
      page,
      limit,
    };
  }

  async findOne(userId: number, id: number) {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['client', 'image'],
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.client.userId !== userId) throw new ForbiddenException();

    // Load only unbilled (open) tasks for the UI — billed tasks are historical
    const openTasks = await this.taskRepo.find({
      where: { projectId: id, invoiceId: null as any },
      order: { order: 'ASC', createdAt: 'DESC' },
    });

    return {
      ...project,
      tasks: openTasks,
      total: Number(project.totalCost) || 0,
      unbilled: Number(project.unbilledCost) || 0,
      billed: Number(project.billedCost) || 0,
      clientName: project.client?.name || '',
      hourlyRate: project.getHourlyRate(),
    };
  }

  async create(userId: number, dto: CreateProjectDto) {
    const client = await this.clientRepo.findOne({
      where: { id: dto.clientId, userId },
    });
    if (!client) throw new NotFoundException('Client not found');

    const project = this.projectRepo.create({
      name: dto.name,
      clientId: dto.clientId,
      hourlyRate: dto.hourlyRate,
      imageId: dto.imageId,
    });
    const saved = await this.projectRepo.save(project);
    await this.activityLogger.log(userId, 'Project', saved.id, 'created');
    return saved;
  }

  private async findEntity(userId: number, id: number): Promise<Project> {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['client', 'tasks', 'image'],
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.client.userId !== userId) throw new ForbiddenException();
    return project;
  }

  async update(userId: number, id: number, dto: UpdateProjectDto) {
    const project = await this.findEntity(userId, id);
    const dirty: Record<string, any> = {};
    const fields: (keyof UpdateProjectDto)[] = [
      'name', 'clientId', 'hourlyRate', 'imageId', 'archived',
    ];
    for (const f of fields) {
      if (dto[f] !== undefined && (project as any)[f] !== dto[f]) {
        dirty[f] = { from: (project as any)[f], to: dto[f] };
        (project as any)[f] = dto[f];
      }
    }
    const saved = await this.projectRepo.save(project);
    if (Object.keys(dirty).length > 0) {
      await this.activityLogger.log(userId, 'Project', id, 'updated', dirty);
    }
    return saved;
  }

  async uploadPicture(userId: number, id: number, file: Express.Multer.File) {
    const project = await this.findEntity(userId, id);
    await this.imagesService.resizeFile(file.path);
    project.picture = file.filename;
    return this.projectRepo.save(project);
  }

  async remove(userId: number, id: number) {
    const project = await this.findEntity(userId, id);
    await this.projectRepo.remove(project);
    await this.activityLogger.log(userId, 'Project', id, 'deleted');
  }

  async recalculate(projectId: number) {
    // Single SQL aggregate — avoids loading potentially thousands of task+session rows into Node.js.
    // calculated_cost per task is already maintained on every task/session mutation.
    // Duration uses fixed_duration when set, otherwise sums sessions via a grouped subquery.
    const [row] = await this.taskRepo.manager.query<any[]>(
      `SELECT
        COALESCE(SUM(CASE WHEN t.invoice_id IS NULL  AND t.is_active = 1 THEN t.calculated_cost END), 0) AS unbilledCost,
        COALESCE(SUM(CASE WHEN t.invoice_id IS NOT NULL AND t.is_active = 1 THEN t.calculated_cost END), 0) AS billedCost,
        COALESCE(SUM(CASE WHEN t.invoice_id IS NULL  AND t.is_active = 1
          THEN COALESCE(t.fixed_duration, s_agg.dur, 0) END), 0) AS unbilledDuration,
        COALESCE(SUM(CASE WHEN t.invoice_id IS NOT NULL AND t.is_active = 1
          THEN COALESCE(t.fixed_duration, s_agg.dur, 0) END), 0) AS billedDuration
       FROM obulus_tasks t
       LEFT JOIN (
         SELECT task_id, SUM(duration) AS dur
         FROM obulus_sessions WHERE is_active = 1 GROUP BY task_id
       ) s_agg ON s_agg.task_id = t.id
       WHERE t.project_id = ?`,
      [projectId],
    );

    const unbilledCost     = Number(row.unbilledCost)     || 0;
    const billedCost       = Number(row.billedCost)       || 0;
    const unbilledDuration = Number(row.unbilledDuration) || 0;
    const billedDuration   = Number(row.billedDuration)   || 0;

    await this.projectRepo.update(projectId, {
      unbilledCost,
      billedCost,
      unbilledDuration,
      billedDuration,
      totalCost:     unbilledCost     + billedCost,
      totalDuration: unbilledDuration + billedDuration,
    });
  }
}
