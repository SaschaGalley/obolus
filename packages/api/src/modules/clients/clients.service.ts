import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, Project, Task, Session } from '../../database/entities';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ActivityLoggerService } from '../activities/activity-logger.service';
import { ImagesService } from '../images/images.service';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly activityLogger: ActivityLoggerService,
    private readonly imagesService: ImagesService,
  ) {}

  async findAll(userId: number, show?: string, page = 1, limit = 20) {
    const qb = this.clientRepo
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.image', 'image')
      .where('client.user_id = :userId', { userId })
      .orderBy('client.name', 'ASC');

    if (show === 'active') {
      qb.andWhere('client.archived = 0');
    } else if (show === 'archived') {
      qb.andWhere('client.archived = 1');
    }

    const [clients, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: clients.map(c => ({
        ...c,
        total: Number(c.totalCost) || 0,
        unbilled: Number(c.unbilledCost) || 0,
        billed: Number(c.billedCost) || 0,
        hourlyRate: c.getHourlyRate(),
      })),
      total,
      page,
      limit,
    };
  }

  async findOne(userId: number, id: number) {
    const client = await this.clientRepo.findOne({
      where: { id, userId },
      relations: ['image', 'projects', 'invoices'],
    });
    if (!client) throw new NotFoundException('Client not found');

    // Recalculate cached fields on show (like Laravel does)
    await this.recalculate(client.id);

    // Re-fetch after recalculate
    const updated = await this.clientRepo.findOne({
      where: { id, userId },
      relations: ['image', 'projects', 'invoices'],
    });
    if (!updated) throw new NotFoundException('Client not found');

    return {
      ...updated,
      total: Number(updated.totalCost) || 0,
      unbilled: Number(updated.unbilledCost) || 0,
      billed: Number(updated.billedCost) || 0,
      hourlyRate: updated.getHourlyRate(),
    };
  }

  async create(userId: number, dto: CreateClientDto) {
    const client = this.clientRepo.create({
      userId,
      name: dto.name,
      address: dto.address,
      vatNumber: dto.vatNumber,
      reverseCharge: dto.reverseCharge || false,
      hourlyRate: dto.hourlyRate,
      imageId: dto.imageId,
    });
    const saved = await this.clientRepo.save(client);
    await this.activityLogger.log(userId, 'Client', saved.id, 'created');
    return saved;
  }

  private async findEntity(userId: number, id: number): Promise<Client> {
    const client = await this.clientRepo.findOne({
      where: { id, userId },
      relations: ['image', 'projects', 'invoices'],
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async update(userId: number, id: number, dto: UpdateClientDto) {
    const client = await this.findEntity(userId, id);
    const dirty: Record<string, any> = {};
    const fields: (keyof UpdateClientDto)[] = [
      'name', 'address', 'vatNumber', 'reverseCharge',
      'hourlyRate', 'imageId', 'archived',
    ];
    for (const f of fields) {
      if (dto[f] !== undefined && (client as any)[f] !== dto[f]) {
        dirty[f] = { from: (client as any)[f], to: dto[f] };
        (client as any)[f] = dto[f];
      }
    }
    const saved = await this.clientRepo.save(client);
    if (Object.keys(dirty).length > 0) {
      await this.activityLogger.log(userId, 'Client', id, 'updated', dirty);
    }
    return saved;
  }

  async uploadPicture(userId: number, id: number, file: Express.Multer.File) {
    const client = await this.findEntity(userId, id);
    await this.imagesService.resizeFile(file.path);
    client.picture = file.filename;
    return this.clientRepo.save(client);
  }

  async remove(userId: number, id: number) {
    const client = await this.findEntity(userId, id);
    await this.clientRepo.remove(client);
    await this.activityLogger.log(userId, 'Client', id, 'deleted');
  }

  async recalculate(clientId: number) {
    const client = await this.clientRepo.findOne({
      where: { id: clientId },
      relations: ['projects'],
    });
    if (!client) return;

    const projectIds = client.projects.map((p) => p.id);
    if (projectIds.length === 0) {
      client.unbilledCost = 0;
      client.unbilledDuration = 0;
      client.billedCost = 0;
      client.billedDuration = 0;
      client.totalCost = 0;
      client.totalDuration = 0;
      await this.clientRepo.save(client);
      return;
    }

    const unbilledTasks = await this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.sessions', 'session')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('project.client', 'client')
      .where('task.project_id IN (:...projectIds)', { projectIds })
      .andWhere('task.invoice_id IS NULL')
      .andWhere('task.is_active = 1')
      .getMany();

    const billedTasks = await this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.sessions', 'session')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('project.client', 'client')
      .where('task.project_id IN (:...projectIds)', { projectIds })
      .andWhere('task.invoice_id IS NOT NULL')
      .andWhere('task.is_active = 1')
      .getMany();

    client.unbilledCost = unbilledTasks.reduce((sum, t) => sum + this.calcTaskCost(t), 0);
    client.unbilledDuration = unbilledTasks.reduce((sum, t) => sum + this.calcTaskDuration(t), 0);
    client.billedCost = billedTasks.reduce((sum, t) => sum + this.calcTaskCost(t), 0);
    client.billedDuration = billedTasks.reduce((sum, t) => sum + this.calcTaskDuration(t), 0);
    client.totalCost = client.unbilledCost + client.billedCost;
    client.totalDuration = client.unbilledDuration + client.billedDuration;

    await this.clientRepo.save(client);
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
}
