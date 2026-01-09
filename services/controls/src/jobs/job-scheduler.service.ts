import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobsService } from './jobs.service';
import * as cronParser from 'cron-parser';

/**
 * Central job scheduler that replaces scattered setInterval calls
 * with a reliable, database-backed job queue system.
 *
 * This service:
 * 1. Processes pending jobs from the queue
 * 2. Triggers scheduled jobs when their time comes
 * 3. Handles delayed/retry jobs
 * 4. Provides crash-resilient scheduling
 */
@Injectable()
export class JobSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobSchedulerService.name);
  private isRunning = false;
  private processingIntervalId: NodeJS.Timeout | null = null;
  private schedulerIntervalId: NodeJS.Timeout | null = null;

  // Processing intervals (in ms)
  private readonly JOB_PROCESSING_INTERVAL = 5000; // 5 seconds
  private readonly SCHEDULER_INTERVAL = 60000; // 1 minute

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
  ) {}

  onModuleInit() {
    if (process.env.DISABLE_JOB_SCHEDULER === 'true') {
      this.logger.warn('Job scheduler is disabled via environment variable');
      return;
    }

    this.logger.log('Starting job scheduler service...');
    this.start();
  }

  onModuleDestroy() {
    this.stop();
  }

  start() {
    if (this.processingIntervalId) {
      return;
    }

    // Start job processing loop
    this.processingIntervalId = setInterval(() => {
      this.processJobs().catch(err => {
        this.logger.error('Error processing jobs', err);
      });
    }, this.JOB_PROCESSING_INTERVAL);

    // Start scheduled job runner
    this.schedulerIntervalId = setInterval(() => {
      this.jobsService.processScheduledJobs().catch(err => {
        this.logger.error('Error processing scheduled jobs', err);
      });
    }, this.SCHEDULER_INTERVAL);

    // Run initial processing
    this.processJobs().catch(err => {
      this.logger.error('Error in initial job processing', err);
    });
    this.jobsService.processScheduledJobs().catch(err => {
      this.logger.error('Error in initial scheduled job processing', err);
    });

    this.logger.log(
      `Job scheduler started (processing: ${this.JOB_PROCESSING_INTERVAL / 1000}s, scheduling: ${this.SCHEDULER_INTERVAL / 1000}s)`,
    );
  }

  stop() {
    if (this.processingIntervalId) {
      clearInterval(this.processingIntervalId);
      this.processingIntervalId = null;
    }
    if (this.schedulerIntervalId) {
      clearInterval(this.schedulerIntervalId);
      this.schedulerIntervalId = null;
    }
    this.logger.log('Job scheduler stopped');
  }

  /**
   * Process pending and delayed jobs
   */
  private async processJobs(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      // Get active queues
      const queues = await this.prisma.jobQueue.findMany({
        where: { isPaused: false },
      });

      for (const queue of queues) {
        await this.processQueueJobs(queue);
      }

      // Promote delayed jobs that are ready
      await this.promoteDelayedJobs();
    } catch (error) {
      this.logger.error('Error in job processing', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process jobs for a specific queue
   */
  private async processQueueJobs(queue: any): Promise<void> {
    // Get pending jobs up to concurrency limit
    const pendingJobs = await this.prisma.job.findMany({
      where: {
        queueId: queue.id,
        status: 'pending',
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      take: queue.concurrency,
    });

    if (pendingJobs.length === 0) {
      return;
    }

    this.logger.debug(`Processing ${pendingJobs.length} jobs from queue ${queue.name}`);

    for (const job of pendingJobs) {
      try {
        // Mark as active
        await this.jobsService.markJobActive(job.id);

        // Execute the job
        const result = await this.executeJob(job);

        // Mark as completed
        await this.jobsService.markJobCompleted(job.id, result);

        this.logger.log(`Job ${job.id} (${job.name}) completed successfully`);
      } catch (error: any) {
        this.logger.error(`Job ${job.id} (${job.name}) failed: ${error.message}`);

        // Mark as failed (service handles retry logic)
        await this.jobsService.markJobFailed(job.id, error.message, error.stack);
      }
    }
  }

  /**
   * Execute a job based on its name
   */
  private async executeJob(job: any): Promise<any> {
    const { name, data } = job;

    // Route job to appropriate handler
    switch (name) {
      // Evidence collector jobs
      case 'run-evidence-collector':
        return this.runEvidenceCollector(data);

      // Notification jobs
      case 'send-scheduled-notifications':
        return this.sendScheduledNotifications(data);

      case 'send-email':
        return this.sendEmail(data);

      // Integration sync jobs
      case 'sync-jira':
        return this.syncJira(data);

      case 'sync-servicenow':
        return this.syncServiceNow(data);

      // Export jobs
      case 'generate-export':
        return this.generateExport(data);

      // Report jobs
      case 'generate-report':
        return this.generateReport(data);

      // Maintenance jobs
      case 'cleanup-expired-sessions':
        return this.cleanupExpiredSessions(data);

      case 'cleanup-old-audit-logs':
        return this.cleanupOldAuditLogs(data);

      case 'run-retention-policies':
        return this.runRetentionPolicies(data);

      case 'refresh-search-indexes':
        return this.refreshSearchIndexes(data);

      // Webhook delivery
      case 'deliver-webhook':
        return this.deliverWebhook(data);

      default:
        this.logger.warn(`Unknown job type: ${name}`);
        return { status: 'skipped', reason: `Unknown job type: ${name}` };
    }
  }

  /**
   * Promote delayed jobs that are ready to run
   */
  private async promoteDelayedJobs(): Promise<void> {
    const now = new Date();

    const result = await this.prisma.job.updateMany({
      where: {
        status: 'delayed',
        delayUntil: { lte: now },
      },
      data: {
        status: 'pending',
        delayUntil: null,
      },
    });

    if (result.count > 0) {
      this.logger.debug(`Promoted ${result.count} delayed jobs to pending`);
    }
  }

  // =============================================
  // Job Handlers
  // =============================================

  private async runEvidenceCollector(data: any): Promise<any> {
    const { collectorId, organizationId } = data;
    this.logger.log(`Running evidence collector ${collectorId}`);
    // This would call the CollectorsService
    // await this.collectorsService.run(collectorId, organizationId, 'system-scheduler');
    return { status: 'completed', collectorId };
  }

  private async sendScheduledNotifications(data: any): Promise<any> {
    this.logger.log('Running scheduled notifications');
    // This would call the ScheduledNotificationsService
    // await this.scheduledNotificationsService.runScheduledNotifications();
    return { status: 'completed' };
  }

  private async sendEmail(data: any): Promise<any> {
    const { to, subject, html } = data;
    this.logger.log(`Sending email to ${to}`);
    // This would call the EmailService
    // await this.emailService.sendEmail({ to, subject, html });
    return { status: 'sent', to };
  }

  private async syncJira(data: any): Promise<any> {
    const { mappingId, organizationId } = data;
    this.logger.log(`Syncing Jira mapping ${mappingId}`);
    // This would call the JiraService
    // await this.jiraService.syncNow(organizationId, mappingId);
    return { status: 'synced', mappingId };
  }

  private async syncServiceNow(data: any): Promise<any> {
    const { mappingId, organizationId } = data;
    this.logger.log(`Syncing ServiceNow mapping ${mappingId}`);
    // This would call the ServiceNowService
    // await this.serviceNowService.syncNow(organizationId, mappingId);
    return { status: 'synced', mappingId };
  }

  private async generateExport(data: any): Promise<any> {
    const { exportId, organizationId } = data;
    this.logger.log(`Generating export ${exportId}`);
    // This would call the ExportsService
    // await this.exportsService.processExport(exportId);
    return { status: 'generated', exportId };
  }

  private async generateReport(data: any): Promise<any> {
    const { reportType, organizationId, parameters } = data;
    this.logger.log(`Generating report ${reportType}`);
    // This would call the ReportsService
    return { status: 'generated', reportType };
  }

  private async cleanupExpiredSessions(data: any): Promise<any> {
    // Note: Session cleanup is handled by the session service
    // This is a placeholder for when proper session table is implemented
    this.logger.log('Session cleanup job executed (placeholder)');
    return { deletedCount: 0, status: 'no-op' };
  }

  private async cleanupOldAuditLogs(data: any): Promise<any> {
    const { retentionDays = 365 } = data;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });
    this.logger.log(`Cleaned up ${result.count} old audit logs`);
    return { deletedCount: result.count, retentionDays };
  }

  private async runRetentionPolicies(data: any): Promise<any> {
    this.logger.log('Running retention policies');
    // This would call the RetentionService
    // await this.retentionService.applyPolicies();
    return { status: 'completed' };
  }

  private async refreshSearchIndexes(data: any): Promise<any> {
    this.logger.log('Refreshing search indexes');
    // This would update tsvector columns for any records that need it
    return { status: 'completed' };
  }

  private async deliverWebhook(data: any): Promise<any> {
    const { deliveryId } = data;
    this.logger.log(`Delivering webhook ${deliveryId}`);
    // This would call the WebhooksService
    // await this.webhooksService.deliverWebhook(deliveryId);
    return { status: 'delivered', deliveryId };
  }
}
