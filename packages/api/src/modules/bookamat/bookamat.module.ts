import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking, YearSettings, User, BookamatAccount, BankMatch, Invoice } from '../../database/entities';
import { PdfModule } from '../../pdf/pdf.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { BookamatController } from './bookamat.controller';
import { BookamatService } from './bookamat.service';
import { BookamatClient } from './bookamat.client';
import { OverviewService } from './overview.service';
import { BookamatScheduler } from './bookamat.scheduler';
import { ReconcileController } from './reconcile/reconcile.controller';
import { ReconcileService } from './reconcile/reconcile.service';
import { UmsatzClient } from './reconcile/umsatz.client';
import { VatController } from './vat/vat.controller';
import { VatService } from './vat/vat.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, YearSettings, User, BookamatAccount, BankMatch, Invoice]),
    PdfModule,
    InvoicesModule,
  ],
  controllers: [BookamatController, ReconcileController, VatController],
  providers: [BookamatClient, BookamatService, OverviewService, BookamatScheduler, ReconcileService, UmsatzClient, VatService],
})
export class BookamatModule {}
