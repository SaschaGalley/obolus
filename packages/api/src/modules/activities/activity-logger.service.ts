import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../../database/entities';

export type LogableType = 'Client' | 'Project' | 'Invoice' | 'Task' | 'Session';
export type ActivityType = 'created' | 'updated' | 'deleted';

@Injectable()
export class ActivityLoggerService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
  ) {}

  async log(
    userId: number,
    logableType: LogableType,
    logableId: number,
    activityType: ActivityType,
    values?: Record<string, any> | null,
  ) {
    if (!userId || !logableId) return;
    try {
      await this.activityRepo.insert({
        userId,
        logableType,
        logableId,
        activityType,
        activityValues: values ? JSON.stringify(values) : null,
      } as any);
    } catch {
      // Activity logging must never break a request
    }
  }
}
