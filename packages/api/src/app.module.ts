import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { ImagesModule } from './modules/images/images.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { SearchModule } from './modules/search/search.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { PdfModule } from './pdf/pdf.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mariadb',
        host: config.get('DATABASE_HOST', 'localhost'),
        port: config.get<number>('DATABASE_PORT', 8552),
        username: config.get('DATABASE_USER', 'obulus'),
        password: config.get('DATABASE_PASSWORD', 'obulus_dev'),
        database: config.get('DATABASE_NAME', 'd025d88e'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
      }),
    }),
    AuthModule,
    ClientsModule,
    ProjectsModule,
    InvoicesModule,
    TasksModule,
    SessionsModule,
    ExpensesModule,
    ImagesModule,
    DashboardModule,
    AccountingModule,
    SearchModule,
    ReportsModule,
    ActivitiesModule,
    PdfModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
