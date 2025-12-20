import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { TprmConfigService } from '../config/tprm-config.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

// ============================================
// Tier-Based Review Scheduling Constants
// ============================================

/**
 * Default tier-to-frequency mapping (used as fallback if config service unavailable)
 */
export const DEFAULT_TIER_REVIEW_FREQUENCY: Record<string, string> = {
  tier_1: 'quarterly',
  tier_2: 'semi_annual',
  tier_3: 'annual',
  tier_4: 'biennial',
};

/**
 * Maps review frequency to months until next review (predefined options)
 */
export const FREQUENCY_MONTHS: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  semi_annual: 6,
  annual: 12,
  biennial: 24,
};

/**
 * Human-readable labels for review frequencies
 */
export const FREQUENCY_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semi_annual: 'Semi-Annual',
  annual: 'Annual',
  biennial: 'Bi-Annual (2 years)',
};

/**
 * Parse a frequency value and return the number of months
 * Supports both predefined values and custom_X format (e.g., 'custom_18' = 18 months)
 */
export function parseFrequencyToMonths(frequency: string): number {
  // Check predefined frequencies first
  if (FREQUENCY_MONTHS[frequency]) {
    return FREQUENCY_MONTHS[frequency];
  }
  
  // Check for custom_X format
  if (frequency.startsWith('custom_')) {
    const months = parseInt(frequency.replace('custom_', ''), 10);
    if (!isNaN(months) && months > 0) {
      return months;
    }
  }
  
  // Default to annual if unparseable
  return 12;
}

/**
 * Format a frequency value for display
 */
export function formatFrequencyLabel(frequency: string): string {
  if (FREQUENCY_LABELS[frequency]) {
    return FREQUENCY_LABELS[frequency];
  }
  
  if (frequency.startsWith('custom_')) {
    const months = parseInt(frequency.replace('custom_', ''), 10);
    if (!isNaN(months) && months > 0) {
      if (months === 1) return '1 Month';
      if (months < 12) return `${months} Months`;
      if (months === 12) return '1 Year';
      if (months % 12 === 0) return `${months / 12} Years`;
      return `${months} Months`;
    }
  }
  
  return frequency;
}

/**
 * Calculate the next review due date based on frequency
 * Supports both predefined and custom frequencies
 */
export function calculateNextReviewDate(
  lastReviewDate: Date | null,
  frequency: string,
): Date {
  const baseDate = lastReviewDate || new Date();
  const months = parseFrequencyToMonths(frequency);
  const nextDate = new Date(baseDate);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
}

/**
 * Check if a vendor review is overdue
 */
export function isReviewOverdue(nextReviewDue: Date | null): boolean {
  if (!nextReviewDue) return false;
  return new Date() > new Date(nextReviewDue);
}

/**
 * Get days until next review (negative if overdue)
 */
export function getDaysUntilReview(nextReviewDue: Date | null): number | null {
  if (!nextReviewDue) return null;
  const now = new Date();
  const due = new Date(nextReviewDue);
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

@Injectable()
export class VendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly tprmConfig: TprmConfigService,
  ) {}

  /**
   * Get the review frequency for a tier using org-level config
   */
  private async getFrequencyForTier(organizationId: string, tier: string): Promise<string> {
    try {
      return await this.tprmConfig.getFrequencyForTier(organizationId, tier);
    } catch {
      // Fallback to default if config service fails
      return DEFAULT_TIER_REVIEW_FREQUENCY[tier] || 'annual';
    }
  }

  async create(createVendorDto: CreateVendorDto, userId: string) {
    // Auto-set review frequency based on tier if not provided
    const tier = createVendorDto.tier || 'tier_3';
    const reviewFrequency = createVendorDto.reviewFrequency || 
      await this.getFrequencyForTier(createVendorDto.organizationId, tier);
    
    // Calculate next review due date
    const nextReviewDue = calculateNextReviewDate(null, reviewFrequency);

    const vendor = await this.prisma.vendor.create({
      data: {
        ...createVendorDto,
        reviewFrequency,
        nextReviewDue,
        createdBy: userId,
      } as any,
    });

    await this.audit.log({
      organizationId: vendor.organizationId,
      userId,
      action: 'CREATE_VENDOR',
      entityType: 'vendor',
      entityId: vendor.id,
      entityName: vendor.name,
      description: `Created vendor ${vendor.name}`,
      metadata: { vendorName: vendor.name, reviewFrequency, nextReviewDue },
    });

    return vendor;
  }

  async findAll(filters?: {
    category?: string;
    tier?: string;
    status?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.tier) {
      where.tier = filters.tier;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { legalName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    where.deletedAt = null;

    return this.prisma.vendor.findMany({
      where,
      include: {
        _count: {
          select: {
            assessments: true,
            contracts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, deletedAt: null },
      include: {
        assessments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        contracts: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            assessments: true,
            contracts: true,
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    return vendor;
  }

  async update(id: string, updateVendorDto: UpdateVendorDto, userId: string) {
    // Get current vendor to check if tier changed
    const currentVendor = await this.findOne(id);
    
    const updateData: any = { ...updateVendorDto };
    
    // If tier is being changed, update review frequency and next review date using org config
    if (updateVendorDto.tier && updateVendorDto.tier !== currentVendor.tier) {
      const newFrequency = await this.getFrequencyForTier(
        currentVendor.organizationId,
        updateVendorDto.tier
      );
      updateData.reviewFrequency = newFrequency;
      updateData.nextReviewDue = calculateNextReviewDate(
        currentVendor.lastReviewedAt,
        newFrequency
      );
    }

    const vendor = await this.prisma.vendor.update({
      where: { id },
      data: updateData,
    });

    await this.audit.log({
      organizationId: vendor.organizationId,
      userId,
      action: 'UPDATE_VENDOR',
      entityType: 'vendor',
      entityId: vendor.id,
      entityName: vendor.name,
      description: `Updated vendor ${vendor.name}`,
      changes: updateVendorDto,
    });

    return vendor;
  }

  async remove(id: string, userId: string) {
    // First, get the vendor to include in audit log
    const vendor = await this.findOne(id);

    // Soft delete from database
    await this.prisma.vendor.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId || 'system',
      },
    });

    await this.audit.log({
      organizationId: vendor.organizationId,
      userId,
      action: 'DELETE_VENDOR',
      entityType: 'vendor',
      entityId: vendor.id,
      entityName: vendor.name,
      description: `Deleted vendor ${vendor.name}`,
    });

    return vendor;
  }

  async updateRiskScore(id: string, inherentRiskScore: string, userId: string) {
    const vendor = await this.prisma.vendor.update({
      where: { id },
      data: { inherentRiskScore: inherentRiskScore as any },
    });

    await this.audit.log({
      organizationId: vendor.organizationId,
      userId,
      action: 'UPDATE_VENDOR_RISK_SCORE',
      entityType: 'vendor',
      entityId: vendor.id,
      entityName: vendor.name,
      description: `Updated risk score for vendor ${vendor.name}`,
      metadata: { inherentRiskScore },
    });

    return vendor;
  }

  async getDashboardStats() {
    const [
      totalVendors,
      activeVendors,
      vendorsByTier,
      vendorsByCategory,
      highRiskVendors,
      recentVendors,
    ] = await Promise.all([
      this.prisma.vendor.count({ where: { deletedAt: null } }),
      this.prisma.vendor.count({ where: { status: 'active', deletedAt: null } }),
      this.prisma.vendor.groupBy({
        by: ['tier'],
        where: { deletedAt: null },
        _count: true,
      }),
      this.prisma.vendor.groupBy({
        by: ['category'],
        where: { deletedAt: null },
        _count: true,
      }),
      this.prisma.vendor.count({
        where: {
          inherentRiskScore: { in: ['high', 'critical'] },
          deletedAt: null,
        },
      }),
      this.prisma.vendor.findMany({
        where: { deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          category: true,
          tier: true,
          inherentRiskScore: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      totalVendors,
      activeVendors,
      vendorsByTier: vendorsByTier.reduce((acc, item) => {
        acc[item.tier] = item._count;
        return acc;
      }, {}),
      vendorsByCategory: vendorsByCategory.reduce((acc, item) => {
        acc[item.category] = item._count;
        return acc;
      }, {}),
      highRiskVendors,
      recentVendors,
    };
  }

  /**
   * Get vendors due for review with categorization
   */
  async getVendorsDueForReview(organizationId?: string) {
    const now = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    const baseWhere: any = {
      deletedAt: null,
      status: 'active',
    };

    if (organizationId) {
      baseWhere.organizationId = organizationId;
    }

    const [overdue, dueThisWeek, dueThisMonth, allUpcoming] = await Promise.all([
      // Overdue reviews
      this.prisma.vendor.findMany({
        where: {
          ...baseWhere,
          nextReviewDue: { lt: now },
        },
        select: {
          id: true,
          name: true,
          vendorId: true,
          tier: true,
          inherentRiskScore: true,
          nextReviewDue: true,
          lastReviewedAt: true,
          reviewFrequency: true,
        },
        orderBy: { nextReviewDue: 'asc' },
      }),

      // Due this week (not overdue)
      this.prisma.vendor.findMany({
        where: {
          ...baseWhere,
          nextReviewDue: { gte: now, lte: oneWeekFromNow },
        },
        select: {
          id: true,
          name: true,
          vendorId: true,
          tier: true,
          inherentRiskScore: true,
          nextReviewDue: true,
          lastReviewedAt: true,
          reviewFrequency: true,
        },
        orderBy: { nextReviewDue: 'asc' },
      }),

      // Due this month (not this week)
      this.prisma.vendor.findMany({
        where: {
          ...baseWhere,
          nextReviewDue: { gt: oneWeekFromNow, lte: oneMonthFromNow },
        },
        select: {
          id: true,
          name: true,
          vendorId: true,
          tier: true,
          inherentRiskScore: true,
          nextReviewDue: true,
          lastReviewedAt: true,
          reviewFrequency: true,
        },
        orderBy: { nextReviewDue: 'asc' },
      }),

      // Count of all upcoming (next 90 days)
      this.prisma.vendor.count({
        where: {
          ...baseWhere,
          nextReviewDue: {
            gte: now,
            lte: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      overdue: overdue.map((v) => ({
        ...v,
        daysOverdue: getDaysUntilReview(v.nextReviewDue) ? Math.abs(getDaysUntilReview(v.nextReviewDue)!) : 0,
      })),
      dueThisWeek: dueThisWeek.map((v) => ({
        ...v,
        daysUntilDue: getDaysUntilReview(v.nextReviewDue),
      })),
      dueThisMonth: dueThisMonth.map((v) => ({
        ...v,
        daysUntilDue: getDaysUntilReview(v.nextReviewDue),
      })),
      summary: {
        overdueCount: overdue.length,
        dueThisWeekCount: dueThisWeek.length,
        dueThisMonthCount: dueThisMonth.length,
        upcomingCount: allUpcoming,
      },
    };
  }

  /**
   * Update vendor's last review date and recalculate next review due
   */
  async updateReviewDates(id: string, userId: string) {
    const vendor = await this.findOne(id);
    const now = new Date();
    const nextReviewDue = calculateNextReviewDate(now, vendor.reviewFrequency || 'annual');

    const updated = await this.prisma.vendor.update({
      where: { id },
      data: {
        lastReviewedAt: now,
        nextReviewDue,
      },
    });

    await this.audit.log({
      organizationId: vendor.organizationId,
      userId,
      action: 'UPDATE_VENDOR_REVIEW_DATES',
      entityType: 'vendor',
      entityId: vendor.id,
      entityName: vendor.name,
      description: `Updated review dates for vendor ${vendor.name}`,
      metadata: { lastReviewedAt: now, nextReviewDue },
    });

    return updated;
  }
}
