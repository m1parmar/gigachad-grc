import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { calculateNextReviewDate } from '../vendors/vendors.service';

@Injectable()
export class AssessmentsService {
  private readonly logger = new Logger(AssessmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(createAssessmentDto: CreateAssessmentDto, userId: string) {
    const assessment = await this.prisma.vendorAssessment.create({
      data: {
        ...createAssessmentDto,
        status: (createAssessmentDto.status || 'pending') as any,
        dueDate: createAssessmentDto.dueDate
          ? new Date(createAssessmentDto.dueDate)
          : undefined,
        completedAt: createAssessmentDto.completedAt
          ? new Date(createAssessmentDto.completedAt)
          : undefined,
        createdBy: userId,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.audit.log({
      organizationId: assessment.organizationId,
      userId,
      action: 'CREATE_ASSESSMENT',
      entityType: 'assessment',
      entityId: assessment.id,
      entityName: `${(assessment as any).vendor.name} - ${assessment.assessmentType}`,
      description: `Created ${assessment.assessmentType} assessment for ${(assessment as any).vendor.name}`,
      metadata: {
        vendorId: assessment.vendorId,
        assessmentType: assessment.assessmentType,
      },
    });

    return assessment;
  }

  async findAll(filters?: {
    vendorId?: string;
    assessmentType?: string;
    status?: string;
  }) {
    try {
      const where: any = {};

      if (filters?.vendorId) {
        where.vendorId = filters.vendorId;
      }

      if (filters?.assessmentType) {
        where.assessmentType = filters.assessmentType;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      return this.prisma.vendorAssessment.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              tier: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      this.logger.error(`Error fetching assessments: ${error.message}`, error.stack);
      return [];
    }
  }

  async findOne(id: string) {
    const assessment = await this.prisma.vendorAssessment.findUnique({
      where: { id },
      include: {
        vendor: true,
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment with ID ${id} not found`);
    }

    return assessment;
  }

  async update(id: string, updateAssessmentDto: UpdateAssessmentDto, userId: string) {
    // Get current assessment to check status change
    const currentAssessment = await this.findOne(id);
    
    const data: any = { ...updateAssessmentDto };

    if (updateAssessmentDto.dueDate) {
      data.dueDate = new Date(updateAssessmentDto.dueDate);
    }

    if (updateAssessmentDto.completedAt) {
      data.completedAt = new Date(updateAssessmentDto.completedAt);
    }

    // If status is being changed to 'completed', set completedAt if not provided
    if (updateAssessmentDto.status === 'completed' && !data.completedAt) {
      data.completedAt = new Date();
    }

    const assessment = await this.prisma.vendorAssessment.update({
      where: { id },
      data,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            reviewFrequency: true,
          },
        },
      },
    });

    // If assessment was just completed, update vendor's review dates
    if (
      updateAssessmentDto.status === 'completed' &&
      currentAssessment.status !== 'completed'
    ) {
      const now = new Date();
      const reviewFrequency = (assessment.vendor as any).reviewFrequency || 'annual';
      const nextReviewDue = calculateNextReviewDate(now, reviewFrequency);

      await this.prisma.vendor.update({
        where: { id: assessment.vendorId },
        data: {
          lastReviewedAt: now,
          nextReviewDue,
        },
      });

      await this.audit.log({
        organizationId: assessment.organizationId,
        userId,
        action: 'VENDOR_REVIEW_COMPLETED',
        entityType: 'vendor',
        entityId: assessment.vendorId,
        entityName: assessment.vendor.name,
        description: `Completed ${assessment.assessmentType} review for ${assessment.vendor.name}. Next review due: ${nextReviewDue.toISOString().split('T')[0]}`,
        metadata: {
          assessmentId: assessment.id,
          assessmentType: assessment.assessmentType,
          nextReviewDue,
        },
      });
    }

    await this.audit.log({
      organizationId: assessment.organizationId,
      userId,
      action: 'UPDATE_ASSESSMENT',
      entityType: 'assessment',
      entityId: assessment.id,
      entityName: `${assessment.vendor.name} - ${assessment.assessmentType}`,
      description: `Updated ${assessment.assessmentType} assessment for ${assessment.vendor.name}`,
      changes: updateAssessmentDto,
    });

    return assessment;
  }

  async remove(id: string, userId: string) {
    const assessment = await this.prisma.vendorAssessment.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment with ID ${id} not found`);
    }

    await this.prisma.vendorAssessment.delete({
      where: { id },
    });

    await this.audit.log({
      organizationId: assessment.organizationId,
      userId,
      action: 'DELETE_ASSESSMENT',
      entityType: 'assessment',
      entityId: assessment.id,
      entityName: `${assessment.vendor.name} - ${assessment.assessmentType}`,
      description: `Deleted ${assessment.assessmentType} assessment for ${assessment.vendor.name}`,
      metadata: {
        vendorId: assessment.vendorId,
        assessmentType: assessment.assessmentType,
      },
    });

    return assessment;
  }

  /**
   * Get upcoming assessments (pending or in_progress with due dates)
   */
  async getUpcomingAssessments(organizationId?: string) {
    const now = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    const baseWhere: any = {
      status: { in: ['pending', 'in_progress'] },
    };

    if (organizationId) {
      baseWhere.organizationId = organizationId;
    }

    const [dueThisWeek, dueThisMonth, allPending] = await Promise.all([
      this.prisma.vendorAssessment.findMany({
        where: {
          ...baseWhere,
          dueDate: { gte: now, lte: oneWeekFromNow },
        },
        include: {
          vendor: {
            select: { id: true, name: true, tier: true },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),

      this.prisma.vendorAssessment.findMany({
        where: {
          ...baseWhere,
          dueDate: { gt: oneWeekFromNow, lte: oneMonthFromNow },
        },
        include: {
          vendor: {
            select: { id: true, name: true, tier: true },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),

      this.prisma.vendorAssessment.count({
        where: baseWhere,
      }),
    ]);

    return {
      dueThisWeek,
      dueThisMonth,
      totalPending: allPending,
    };
  }

  /**
   * Get overdue assessments
   */
  async getOverdueAssessments(organizationId?: string) {
    const now = new Date();

    const where: any = {
      status: { in: ['pending', 'in_progress'] },
      dueDate: { lt: now },
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    const overdue = await this.prisma.vendorAssessment.findMany({
      where,
      include: {
        vendor: {
          select: { id: true, name: true, tier: true, inherentRiskScore: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return overdue.map((assessment) => ({
      ...assessment,
      daysOverdue: Math.ceil(
        (now.getTime() - new Date(assessment.dueDate!).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    }));
  }

  /**
   * Get assessment statistics for dashboard
   */
  async getAssessmentStats(organizationId?: string) {
    const now = new Date();

    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }

    const [total, byStatus, overdue, completedThisMonth] = await Promise.all([
      this.prisma.vendorAssessment.count({ where }),

      this.prisma.vendorAssessment.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),

      this.prisma.vendorAssessment.count({
        where: {
          ...where,
          status: { in: ['pending', 'in_progress'] },
          dueDate: { lt: now },
        },
      }),

      this.prisma.vendorAssessment.count({
        where: {
          ...where,
          status: 'completed',
          completedAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      overdue,
      completedThisMonth,
    };
  }
}
