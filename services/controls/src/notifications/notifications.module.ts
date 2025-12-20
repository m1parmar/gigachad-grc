import { Module, Global } from '@nestjs/common';
import { makeCounterProvider } from '@willsoto/nestjs-prometheus';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { ScheduledNotificationsService } from './scheduled-notifications.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Global()
@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    ScheduledNotificationsService,
    // Metrics: track scheduled notification runs grouped by status
    makeCounterProvider({
      name: 'scheduled_notifications_runs_total',
      help: 'Total number of scheduled notification runs grouped by status',
      labelNames: ['status'],
    }),
  ],
  exports: [NotificationsService, ScheduledNotificationsService],
})
export class NotificationsModule {}



