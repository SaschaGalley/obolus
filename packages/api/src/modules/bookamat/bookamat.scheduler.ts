import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities';
import { BookamatService } from './bookamat.service';
import { BookamatClient } from './bookamat.client';

/**
 * Daily background sync of the current year for every user.
 *
 * Single-user is the only deployment shape we currently support, but iterating
 * over all users keeps the scheduler future-proof: the day obulus becomes
 * multi-tenant the only thing that needs changing is *where* credentials come
 * from (BookamatClient is global today, will become per-user later).
 *
 * Skipped silently when credentials are unset – avoids spamming logs in dev.
 */
@Injectable()
export class BookamatScheduler {
  private readonly logger = new Logger(BookamatScheduler.name);

  constructor(
    private readonly bookamat: BookamatService,
    private readonly client: BookamatClient,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'bookamat-daily-sync' })
  async daily(): Promise<void> {
    if (!this.client.isConfigured()) {
      return;
    }
    const year = new Date().getFullYear();
    const users = await this.userRepo.find();
    for (const user of users) {
      try {
        await this.bookamat.syncYear(user.id, year);
      } catch (err) {
        this.logger.error(`Daily sync failed for user ${user.id}: ${(err as Error).message}`);
      }
    }
  }
}
