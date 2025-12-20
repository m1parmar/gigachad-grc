import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '@gigachad-grc/shared';

// Controllers
import { BusinessProcessesController } from './business-processes.controller';
import { BCDRPlansController } from './bcdr-plans.controller';
import { DRTestsController } from './dr-tests.controller';
import { RunbooksController } from './runbooks.controller';
import { CommunicationPlansController } from './communication-plans.controller';
import { BCDRDashboardController } from './bcdr-dashboard.controller';

// Services
import { BusinessProcessesService } from './business-processes.service';
import { BCDRPlansService } from './bcdr-plans.service';
import { DRTestsService } from './dr-tests.service';
import { RunbooksService } from './runbooks.service';
import { CommunicationPlansService } from './communication-plans.service';
import { BCDRDashboardService } from './bcdr-dashboard.service';
import { RecoveryStrategiesService } from './recovery-strategies.service';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    NotificationsModule,
    StorageModule.forRoot(),
  ],
  controllers: [
    BusinessProcessesController,
    BCDRPlansController,
    DRTestsController,
    RunbooksController,
    CommunicationPlansController,
    BCDRDashboardController,
  ],
  providers: [
    BusinessProcessesService,
    BCDRPlansService,
    DRTestsService,
    RunbooksService,
    CommunicationPlansService,
    BCDRDashboardService,
    RecoveryStrategiesService,
  ],
  exports: [
    BusinessProcessesService,
    BCDRPlansService,
    DRTestsService,
    RunbooksService,
    CommunicationPlansService,
    BCDRDashboardService,
    RecoveryStrategiesService,
  ],
})
export class BCDRModule {}

