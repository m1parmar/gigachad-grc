import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobSchedulerService } from './job-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [JobsService, JobSchedulerService],
  controllers: [JobsController],
  exports: [JobsService, JobSchedulerService],
})
export class JobsModule {}
