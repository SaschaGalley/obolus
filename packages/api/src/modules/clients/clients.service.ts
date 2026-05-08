import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, Task } from '../../database/entities';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ActivityLoggerService } from '../activities/activity-logger.service';
import { ImagesService } from '../images/images.service';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
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
      relations: ['image'],
    });
    if (!client) throw new NotFoundException('Client not found');

    return {
      ...client,
      total: Number(client.totalCost) || 0,
      unbilled: Number(client.unbilledCost) || 0,
      billed: Number(client.billedCost) || 0,
      hourlyRate: client.getHourlyRate(),
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
      relations: ['image'],
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
    // Aggregate entirely in SQL — no task/session objects loaded into Node.js.
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
       LEFT JOIN (
         SELECT task_id, SUM(duration) AS dur
         FROM obulus_sessions WHERE is_active = 1 GROUP BY task_id
       ) s_agg ON s_agg.task_id = t.id
       WHERE p.client_id = ?`,
      [clientId],
    );

    const unbilledCost     = Number(row.unbilledCost)     || 0;
    const billedCost       = Number(row.billedCost)       || 0;
    const unbilledDuration = Number(row.unbilledDuration) || 0;
    const billedDuration   = Number(row.billedDuration)   || 0;

    await this.clientRepo.update(clientId, {
      unbilledCost,
      billedCost,
      unbilledDuration,
      billedDuration,
      totalCost:     unbilledCost     + billedCost,
      totalDuration: unbilledDuration + billedDuration,
    });
  }
}
