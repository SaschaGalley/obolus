import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, Task } from '../../database/entities';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ProjectsService } from '../projects/projects.service';
import { ClientsService } from '../clients/clients.service';
import { ActivityLoggerService } from '../activities/activity-logger.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly projectsService: ProjectsService,
    private readonly clientsService: ClientsService,
    private readonly activityLogger: ActivityLoggerService,
  ) {
  }

  async findAll(userId: number, filters: { projectId?: number; invoiceId?: number; open?: boolean } = {}) {
    const qb = this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('project.client', 'client')
      .leftJoinAndSelect('task.sessions', 'session')
      .where('client.user_id = :userId', { userId })
      .orderBy('task.order', 'ASC')
      .addOrderBy('task.created_at', 'DESC');

    if (filters.projectId) {
      qb.andWhere('task.project_id = :projectId', { projectId: filters.projectId });
    }

    if (filters.invoiceId) {
      qb.andWhere('task.invoice_id = :invoiceId', { invoiceId: filters.invoiceId });
    }

    if (filters.open) {
      qb.andWhere('task.invoice_id IS NULL');
    }

    return qb.getMany();
  }

  async findOne(userId: number, id: number) {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['project', 'project.client', 'sessions', 'invoice'],
    });
    if (!task) throw new NotFoundException('Task not found');
    if (task.project.client.userId !== userId) throw new ForbiddenException();
    return task;
  }

  async create(userId: number, dto: CreateTaskDto) {
    const project = await this.projectRepo.findOne({
      where: { id: dto.projectId },
      relations: ['client'],
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.client.userId !== userId) throw new ForbiddenException();

    const task = this.taskRepo.create({
      projectId: dto.projectId,
      name: dto.name,
      note: dto.note,
      hourlyRate: dto.hourlyRate,
      fixedCost: dto.fixedCost,
      fixedDuration: dto.fixedDuration,
      fixedDate: dto.fixedDate,
    });
    const saved = await this.taskRepo.save(task);

    // Calculate and save calculatedCost
    saved.calculatedCost = dto.fixedCost ? Number(dto.fixedCost) :
      (dto.fixedDuration ? Number(dto.fixedDuration) * this.getHourlyRate({ ...saved, project } as Task) : 0);
    await this.taskRepo.save(saved);

    await this.recalculateParents(project);

    await this.activityLogger.log(userId, 'Task', saved.id, 'created');

    return saved;
  }

  async update(userId: number, id: number, dto: UpdateTaskDto) {
    const task = await this.findOne(userId, id);
    const dirty: Record<string, any> = {};
    const fields: (keyof UpdateTaskDto)[] = [
      'name', 'note', 'hourlyRate', 'fixedCost', 'fixedDuration',
      'fixedDate', 'isActive', 'order', 'projectId',
    ];
    for (const f of fields) {
      if (dto[f] !== undefined && (task as any)[f] !== dto[f]) {
        dirty[f] = { from: (task as any)[f], to: dto[f] };
        (task as any)[f] = dto[f];
      }
    }

    // Recalculate task cost
    const taskWithRelations = await this.taskRepo.findOne({
      where: { id: task.id },
      relations: ['sessions', 'project', 'project.client'],
    });
    task.calculatedCost = this.getTaskCost(taskWithRelations || task);

    const saved = await this.taskRepo.save(task);

    const project = await this.projectRepo.findOne({
      where: { id: task.projectId },
      relations: ['client'],
    });
    if (project) {
      await this.recalculateParents(project);
    }

    if (Object.keys(dirty).length > 0) {
      await this.activityLogger.log(userId, 'Task', id, 'updated', dirty);
    }

    return saved;
  }

  async remove(userId: number, id: number) {
    const task = await this.findOne(userId, id);
    const project = await this.projectRepo.findOne({
      where: { id: task.projectId },
      relations: ['client'],
    });

    await this.taskRepo.remove(task);

    if (project) {
      await this.recalculateParents(project);
    }

    await this.activityLogger.log(userId, 'Task', id, 'deleted');
  }

  async reorder(tasks: { id: number; order: number }[]) {
    for (const item of tasks) {
      await this.taskRepo.update(item.id, { order: item.order });
    }
  }

  getTaskDuration(task: Task): number {
    if (task.fixedDuration) return Number(task.fixedDuration);
    return (task.sessions || [])
      .filter((s) => s.isActive)
      .reduce((sum, s) => sum + Number(s.duration), 0);
  }

  getTaskCost(task: Task): number {
    if (task.fixedCost) return Number(task.fixedCost);
    const duration = this.getTaskDuration(task);
    const rate = this.getHourlyRate(task);
    return duration * rate;
  }

  getHourlyRate(task: Task): number {
    if (task.hourlyRate) return Number(task.hourlyRate);
    if (task.project?.hourlyRate) return Number(task.project.hourlyRate);
    if (task.project?.client?.hourlyRate) return Number(task.project.client.hourlyRate);
    return 65;
  }

  private async recalculateParents(project: Project) {
    await this.projectsService.recalculate(project.id);
    await this.clientsService.recalculate(project.clientId);
  }
}
