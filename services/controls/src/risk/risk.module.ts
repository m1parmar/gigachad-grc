import { Module } from '@nestjs/common';
import { RiskService } from './risk.service';
import { RiskController } from './risk.controller';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { RiskWorkflowService } from './risk-workflow.service';
import { RiskWorkflowController } from './risk-workflow.controller';
import { RiskConfigService } from './risk-config.service';
import { RiskConfigController } from './risk-config.controller';
import { RiskScenariosService } from './risk-scenarios.service';
import { RiskScenariosController } from './risk-scenarios.controller';
import { RiskScenarioLibraryService } from './risk-scenario-library.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, AuditModule, NotificationsModule],
  controllers: [RiskController, AssetsController, RiskWorkflowController, RiskConfigController, RiskScenariosController],
  providers: [RiskService, AssetsService, RiskWorkflowService, RiskConfigService, RiskScenariosService, RiskScenarioLibraryService],
  exports: [RiskService, AssetsService, RiskWorkflowService, RiskConfigService, RiskScenariosService, RiskScenarioLibraryService],
})
export class RiskModule {}

