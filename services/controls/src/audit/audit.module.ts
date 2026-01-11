import { Module, Global } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditsController } from './audits.controller';
import { AuditsService } from './audits.service';
import { AuditRequestsController } from './audit-requests.controller';
import { AuditRequestsService } from './audit-requests.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global() // Make audit service available everywhere without importing
@Module({
  imports: [PrismaModule],
  controllers: [
    AuditController,
    AuditsController,
    AuditRequestsController
  ],
  providers: [
    AuditService,
    AuditsService,
    AuditRequestsService
  ],
  exports: [
    AuditService,
    AuditsService,
    AuditRequestsService
  ],
})
export class AuditModule { }
