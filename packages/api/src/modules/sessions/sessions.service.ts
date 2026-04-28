import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session, Task, Project, Client } from '../../database/entities';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { ProjectsService } from '../projects/projects.service';
import { ClientsService } from '../clients/clients.service';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly projectsService: ProjectsService,
    private readonly clientsService: ClientsService,
    private readonly tasksService: TasksService,
  ) {}

  async findAll(userId: number, taskId?: number) {
    const qb = this.sessionRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.task', 'task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('project.client', 'client')
      .where('client.user_id = :userId', { userId })
      .orderBy('session.started_at', 'DESC');

    if (taskId) {
      qb.andWhere('session.task_id = :taskId', { taskId });
    }

    return qb.getMany();
  }

  async findOne(userId: number, id: number) {
    const session = await this.sessionRepo.findOne({
      where: { id },
      relations: ['task', 'task.project', 'task.project.client'],
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.task.project.client.userId !== userId) throw new ForbiddenException();
    return session;
  }

  async create(userId: number, dto: CreateSessionDto) {
    const task = await this.taskRepo.findOne({
      where: { id: dto.taskId },
      relations: ['project', 'project.client'],
    });
    if (!task) throw new NotFoundException('Task not found');
    if (task.project.client.userId !== userId) throw new ForbiddenException();

    const session = this.sessionRepo.create({
      taskId: dto.taskId,
      startedAt: dto.startedAt || new Date(),
      duration: dto.duration ?? 0,
      note: dto.note,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.sessionRepo.save(session);

    await this.recalculateParents(task.project);

    // Update task calculatedCost
    const updatedTask = await this.taskRepo.findOne({
      where: { id: dto.taskId },
      relations: ['sessions', 'project', 'project.client'],
    });
    if (updatedTask) {
      updatedTask.calculatedCost = this.tasksService.getTaskCost(updatedTask);
      await this.taskRepo.save(updatedTask);
    }

    return saved;
  }

  async update(userId: number, id: number, dto: UpdateSessionDto) {
    const session = await this.findOne(userId, id);
    Object.assign(session, {
      ...(dto.startedAt !== undefined && { startedAt: dto.startedAt }),
      ...(dto.duration !== undefined && { duration: dto.duration }),
      ...(dto.note !== undefined && { note: dto.note }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.taskId !== undefined && { taskId: dto.taskId }),
    });
    const saved = await this.sessionRepo.save(session);

    const task = await this.taskRepo.findOne({
      where: { id: session.taskId },
      relations: ['project', 'project.client'],
    });
    if (task) {
      await this.recalculateParents(task.project);
    }

    // Update task calculatedCost
    const updatedTask = await this.taskRepo.findOne({
      where: { id: session.taskId },
      relations: ['sessions', 'project', 'project.client'],
    });
    if (updatedTask) {
      updatedTask.calculatedCost = this.tasksService.getTaskCost(updatedTask);
      await this.taskRepo.save(updatedTask);
    }

    return saved;
  }

  async remove(userId: number, id: number) {
    const session = await this.findOne(userId, id);
    const task = await this.taskRepo.findOne({
      where: { id: session.taskId },
      relations: ['project', 'project.client'],
    });

    const taskId = session.taskId;
    await this.sessionRepo.remove(session);

    if (task) {
      await this.recalculateParents(task.project);
    }

    // Update task calculatedCost
    const updatedTask = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['sessions', 'project', 'project.client'],
    });
    if (updatedTask) {
      updatedTask.calculatedCost = this.tasksService.getTaskCost(updatedTask);
      await this.taskRepo.save(updatedTask);
    }
  }

  private async recalculateParents(project: Project) {
    await this.projectsService.recalculate(project.id);
    await this.clientsService.recalculate(project.clientId);
  }
}
