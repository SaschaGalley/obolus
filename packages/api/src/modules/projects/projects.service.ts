import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, Project, Task, Session } from '../../database/entities';
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

  async findAll(userId: number, filters: { show?: string; clientId?: number } = {}) {
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

    const projects = await qb.getMany();
    return projects.map(p => ({
      ...p,
      total: Number(p.totalCost) || 0,
      unbilled: Number(p.unbilledCost) || 0,
      billed: Number(p.billedCost) || 0,
      clientName: p.client?.name || '',
      hourlyRate: p.getHourlyRate(),
    }));
  }

  async findOne(userId: number, id: number) {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['client', 'tasks', 'tasks.sessions', 'image'],
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.client.userId !== userId) throw new ForbiddenException();

    // Recalculate on show
    await this.recalculate(project.id);

    // Re-fetch
    const updated = await this.projectRepo.findOne({
      where: { id },
      relations: ['client', 'tasks', 'tasks.sessions', 'image'],
    });
    if (!updated) throw new NotFoundException('Project not found');

    return {
      ...updated,
      total: Number(updated.totalCost) || 0,
      unbilled: Number(updated.unbilledCost) || 0,
      billed: Number(updated.billedCost) || 0,
      clientName: updated.client?.name || '',
      hourlyRate: updated.getHourlyRate(),
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
      relations: ['client', 'tasks', 'tasks.sessions', 'image'],
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
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['client'],
    });
    if (!project) return;

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

    project.unbilledCost = unbilledTasks.reduce((sum, t) => sum + this.calcTaskCost(t), 0);
    project.unbilledDuration = unbilledTasks.reduce((sum, t) => sum + this.calcTaskDuration(t), 0);
    project.billedCost = billedTasks.reduce((sum, t) => sum + this.calcTaskCost(t), 0);
    project.billedDuration = billedTasks.reduce((sum, t) => sum + this.calcTaskDuration(t), 0);
    project.totalCost = project.unbilledCost + project.billedCost;
    project.totalDuration = project.unbilledDuration + project.billedDuration;

    await this.projectRepo.save(project);
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
}
