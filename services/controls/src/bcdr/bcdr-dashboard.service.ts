import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessProcessesService } from './business-processes.service';
import { BCDRPlansService } from './bcdr-plans.service';
import { DRTestsService } from './dr-tests.service';
import { RunbooksService } from './runbooks.service';
import { RecoveryStrategiesService } from './recovery-strategies.service';

@Injectable()
export class BCDRDashboardService {
  private readonly logger = new Logger(BCDRDashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly processesService: BusinessProcessesService,
    private readonly plansService: BCDRPlansService,
    private readonly testsService: DRTestsService,
    private readonly runbooksService: RunbooksService,
    private readonly strategiesService: RecoveryStrategiesService,
  ) {}

  // Helper function to convert BigInt values to Numbers in an object
  private convertBigIntToNumber(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return Number(obj);
    if (Array.isArray(obj)) return obj.map(item => this.convertBigIntToNumber(item));
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const key in obj) {
        converted[key] = this.convertBigIntToNumber(obj[key]);
      }
      return converted;
    }
    return obj;
  }

  async getSummary(organizationId: string) {
    try {
      if (!organizationId) {
        this.logger.warn('getSummary called without organizationId');
        return {
          processes: { total: 0, active: 0, reviewed: 0 },
          plans: { total: 0, published: 0, draft: 0 },
          tests: { total: 0, passed: 0, failed: 0 },
          runbooks: { total: 0, active: 0 },
          strategies: { total: 0 },
          upcomingTests: [],
          overdueItems: { plans: [], processes: [], findings: [], totalOverdue: 0 },
          lastUpdated: new Date().toISOString(),
        };
      }

      const [
        processStats,
        planStats,
        testStats,
        runbookStats,
        strategyStats,
        upcomingTests,
        overdueItems,
      ] = await Promise.all([
        this.processesService.getStats(organizationId).catch(e => {
          this.logger.error(`Error getting process stats: ${e.message}`, e.stack);
          return { total: 0, active: 0, reviewed: 0 };
        }),
        this.plansService.getStats(organizationId).catch(e => {
          this.logger.error(`Error getting plan stats: ${e.message}`, e.stack);
          return { total: 0, published: 0, draft: 0 };
        }),
        this.testsService.getStats(organizationId).catch(e => {
          this.logger.error(`Error getting test stats: ${e.message}`, e.stack);
          return { total: 0, passed: 0, failed: 0 };
        }),
        this.runbooksService.getStats(organizationId).catch(e => {
          this.logger.error(`Error getting runbook stats: ${e.message}`, e.stack);
          return { total: 0, active: 0 };
        }),
        this.strategiesService.getStats(organizationId).catch(e => {
          this.logger.error(`Error getting strategy stats: ${e.message}`, e.stack);
          return { total: 0 };
        }),
        this.testsService.getUpcomingTests(organizationId, 30).catch(e => {
          this.logger.error(`Error getting upcoming tests: ${e.message}`, e.stack);
          return [];
        }),
        this.getOverdueItems(organizationId).catch(e => {
          this.logger.error(`Error getting overdue items: ${e.message}`, e.stack);
          return { plans: [], processes: [], findings: [], totalOverdue: 0 };
        }),
      ]);

      return {
        processes: this.convertBigIntToNumber(processStats),
        plans: this.convertBigIntToNumber(planStats),
        tests: this.convertBigIntToNumber(testStats),
        runbooks: this.convertBigIntToNumber(runbookStats),
        strategies: this.convertBigIntToNumber(strategyStats),
        upcomingTests: this.convertBigIntToNumber(Array.isArray(upcomingTests) ? upcomingTests.slice(0, 5) : []),
        overdueItems: this.convertBigIntToNumber(overdueItems),
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get BCDR summary for organization ${organizationId}: ${error.message}`, error.stack);
      return {
        processes: { total: 0, active: 0, reviewed: 0 },
        plans: { total: 0, published: 0, draft: 0 },
        tests: { total: 0, passed: 0, failed: 0 },
        runbooks: { total: 0, active: 0 },
        strategies: { total: 0 },
        upcomingTests: [],
        overdueItems: { plans: [], processes: [], findings: [], totalOverdue: 0 },
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  async getOverdueItems(organizationId: string) {
    try {
      if (!organizationId) {
        return { plans: [], processes: [], findings: [], totalOverdue: 0 };
      }

      // Get overdue plan reviews
      const overduePlans = await this.prisma.$queryRaw<any[]>`
        SELECT id, plan_id, title, 'bcdr_plan' as entity_type, next_review_due as due_date
        FROM bcdr.bcdr_plans
        WHERE organization_id = ${organizationId}
          AND deleted_at IS NULL
          AND status = 'published'
          AND next_review_due < NOW()
        ORDER BY next_review_due ASC
        LIMIT 10
      `.catch(() => []);

      // Get overdue process reviews
      const overdueProcesses = await this.prisma.$queryRaw<any[]>`
        SELECT id, process_id, name as title, 'business_process' as entity_type, next_review_due as due_date
        FROM bcdr.business_processes
        WHERE organization_id = ${organizationId}
          AND deleted_at IS NULL
          AND is_active = true
          AND next_review_due < NOW()
        ORDER BY next_review_due ASC
        LIMIT 10
      `.catch(() => []);

      // Get overdue test findings
      const overdueFindings = await this.prisma.$queryRaw<any[]>`
        SELECT f.id, f.title, 'test_finding' as entity_type, f.remediation_due_date as due_date,
               t.test_id, t.name as test_name
        FROM bcdr.dr_test_findings f
        JOIN bcdr.dr_tests t ON f.test_id = t.id
        WHERE t.organization_id = ${organizationId}
          AND f.remediation_required = true
          AND f.remediation_status NOT IN ('resolved', 'accepted')
          AND f.remediation_due_date < NOW()
        ORDER BY f.remediation_due_date ASC
        LIMIT 10
      `.catch(() => []);

      return {
        plans: Array.isArray(overduePlans) ? overduePlans : [],
        processes: Array.isArray(overdueProcesses) ? overdueProcesses : [],
        findings: Array.isArray(overdueFindings) ? overdueFindings : [],
        totalOverdue: (Array.isArray(overduePlans) ? overduePlans.length : 0) + 
                      (Array.isArray(overdueProcesses) ? overdueProcesses.length : 0) + 
                      (Array.isArray(overdueFindings) ? overdueFindings.length : 0),
      };
    } catch (error) {
      this.logger.error(`Failed to get overdue items for organization ${organizationId}: ${error.message}`, error.stack);
      return { plans: [], processes: [], findings: [], totalOverdue: 0 };
    }
  }

  async getCriticalityDistribution(organizationId: string) {
    try {
      if (!organizationId) {
        return [];
      }

      const distribution = await this.prisma.$queryRaw<any[]>`
        SELECT 
          criticality_tier,
          COUNT(*) as count,
          AVG(rto_hours) as avg_rto,
          AVG(rpo_hours) as avg_rpo
        FROM bcdr.business_processes
        WHERE organization_id = ${organizationId}
          AND deleted_at IS NULL
          AND is_active = true
        GROUP BY criticality_tier
        ORDER BY 
          CASE criticality_tier 
            WHEN 'tier_1_critical' THEN 1 
            WHEN 'tier_2_essential' THEN 2 
            WHEN 'tier_3_important' THEN 3 
            ELSE 4 
          END
      `.catch((e) => {
        this.logger.error(`Error getting criticality distribution: ${e.message}`, e.stack);
        return [];
      });

      return Array.isArray(distribution) ? distribution : [];
    } catch (error) {
      this.logger.error(`Failed to get criticality distribution for organization ${organizationId}: ${error.message}`, error.stack);
      return [];
    }
  }

  async getTestHistory(organizationId: string, months: number = 12) {
    try {
      if (!organizationId) {
        return [];
      }

      // Validate and sanitize months parameter to prevent SQL injection
      const safeMonths = Math.min(Math.max(1, Math.floor(Number(months) || 12)), 60);
      
      const history = await this.prisma.$queryRaw<any[]>`
        SELECT 
          DATE_TRUNC('month', actual_end_at) as month,
          COUNT(*) as total_tests,
          COUNT(*) FILTER (WHERE result = 'passed') as passed,
          COUNT(*) FILTER (WHERE result = 'passed_with_issues') as passed_with_issues,
          COUNT(*) FILTER (WHERE result = 'failed') as failed,
          AVG(actual_recovery_time_minutes) as avg_recovery_time
        FROM bcdr.dr_tests
        WHERE organization_id = ${organizationId}
          AND deleted_at IS NULL
          AND status = 'completed'
          AND actual_end_at >= NOW() - (${safeMonths} || ' months')::INTERVAL
        GROUP BY DATE_TRUNC('month', actual_end_at)
        ORDER BY month DESC
      `.catch((e) => {
        this.logger.error(`Error getting test history: ${e.message}`, e.stack);
        return [];
      });

      return Array.isArray(history) ? history : [];
    } catch (error) {
      this.logger.error(`Failed to get test history for organization ${organizationId}: ${error.message}`, error.stack);
      return [];
    }
  }

  async getRTORPOAnalysis(organizationId: string) {
    try {
      if (!organizationId) {
        return { analysis: [], summary: { compliant: 0, atRisk: 0, noStrategy: 0, total: 0 } };
      }

      const analysis = await this.prisma.$queryRaw<any[]>`
        SELECT 
          bp.id, bp.process_id, bp.name, bp.criticality_tier,
          bp.rto_hours, bp.rpo_hours,
          rs.estimated_recovery_time_hours as strategy_recovery_time,
          CASE 
            WHEN rs.estimated_recovery_time_hours <= bp.rto_hours THEN 'compliant'
            WHEN rs.estimated_recovery_time_hours IS NULL THEN 'no_strategy'
            ELSE 'at_risk'
          END as rto_status
        FROM bcdr.business_processes bp
        LEFT JOIN bcdr.recovery_strategies rs ON bp.id = rs.process_id AND rs.deleted_at IS NULL
        WHERE bp.organization_id = ${organizationId}
          AND bp.deleted_at IS NULL
          AND bp.is_active = true
          AND bp.rto_hours IS NOT NULL
        ORDER BY 
          CASE bp.criticality_tier 
            WHEN 'tier_1_critical' THEN 1 
            WHEN 'tier_2_essential' THEN 2 
            WHEN 'tier_3_important' THEN 3 
            ELSE 4 
          END,
          bp.rto_hours ASC
      `.catch((e) => {
        this.logger.error(`Error getting RTO/RPO analysis: ${e.message}`, e.stack);
        return [];
      });

      const analysisArray = Array.isArray(analysis) ? analysis : [];
      const summary = {
        compliant: analysisArray.filter(a => a.rto_status === 'compliant').length,
        atRisk: analysisArray.filter(a => a.rto_status === 'at_risk').length,
        noStrategy: analysisArray.filter(a => a.rto_status === 'no_strategy').length,
        total: analysisArray.length,
      };

      return { analysis: analysisArray, summary };
    } catch (error) {
      this.logger.error(`Failed to get RTO/RPO analysis for organization ${organizationId}: ${error.message}`, error.stack);
      return { analysis: [], summary: { compliant: 0, atRisk: 0, noStrategy: 0, total: 0 } };
    }
  }

  async getPlanCoverage(organizationId: string) {
    try {
      if (!organizationId) {
        return { coverage: [], summary: { covered: 0, notCovered: 0, total: 0, coveragePercent: 0 } };
      }

      const coverage = await this.prisma.$queryRaw<any[]>`
        SELECT 
          bp.id, bp.process_id, bp.name, bp.criticality_tier,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM bcdr.bcdr_plans p 
              WHERE p.organization_id = ${organizationId}
                AND p.deleted_at IS NULL
                AND p.status = 'published'
                AND bp.id = ANY(p.in_scope_processes)
            ) THEN true
            ELSE false
          END as has_plan,
          (
            SELECT COUNT(*) FROM bcdr.bcdr_plans p 
            WHERE p.organization_id = ${organizationId}
              AND p.deleted_at IS NULL
              AND p.status = 'published'
              AND bp.id = ANY(p.in_scope_processes)
          ) as plan_count
        FROM bcdr.business_processes bp
        WHERE bp.organization_id = ${organizationId}
          AND bp.deleted_at IS NULL
          AND bp.is_active = true
        ORDER BY 
          CASE bp.criticality_tier 
            WHEN 'tier_1_critical' THEN 1 
            WHEN 'tier_2_essential' THEN 2 
            WHEN 'tier_3_important' THEN 3 
            ELSE 4 
          END
      `.catch((e) => {
        this.logger.error(`Error getting plan coverage: ${e.message}`, e.stack);
        return [];
      });

      const coverageArray = Array.isArray(coverage) ? coverage : [];
      const summary = {
        covered: coverageArray.filter(c => c.has_plan).length,
        notCovered: coverageArray.filter(c => !c.has_plan).length,
        total: coverageArray.length,
        coveragePercent: coverageArray.length > 0 
          ? Math.round((coverageArray.filter(c => c.has_plan).length / coverageArray.length) * 100)
          : 0,
      };

      return { coverage: coverageArray, summary };
    } catch (error) {
      this.logger.error(`Failed to get plan coverage for organization ${organizationId}: ${error.message}`, error.stack);
      return { coverage: [], summary: { covered: 0, notCovered: 0, total: 0, coveragePercent: 0 } };
    }
  }

  async getRecentActivity(organizationId: string, limit: number = 20) {
    try {
      if (!organizationId) {
        return [];
      }

      const activity = await this.prisma.$queryRaw<any[]>`
        SELECT 
          id, action, entity_type, entity_id, entity_name, 
          description, timestamp, user_email, user_name
        FROM controls.audit_logs
        WHERE organization_id = ${organizationId}
          AND entity_type IN ('business_process', 'bcdr_plan', 'dr_test', 'runbook', 'recovery_strategy', 'communication_plan')
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `.catch((e) => {
        this.logger.error(`Error getting recent activity: ${e.message}`, e.stack);
        return [];
      });

      return Array.isArray(activity) ? activity : [];
    } catch (error) {
      this.logger.error(`Failed to get recent activity for organization ${organizationId}: ${error.message}`, error.stack);
      return [];
    }
  }

  async getMetrics(organizationId: string) {
    try {
      if (!organizationId) {
        return {
          readinessScore: 0,
          metrics: { rtoCoverage: 0, planCoverage: 0, testSuccessRate: 0, overdueItems: 0 },
          breakdown: { rto: { compliant: 0, atRisk: 0, noStrategy: 0, total: 0 }, plans: { covered: 0, notCovered: 0, total: 0, coveragePercent: 0 }, tests: { total: 0, completed: 0, passed: 0, failed: 0 } },
        };
      }

      // Calculate overall BC/DR readiness score
      const [rtoAnalysis, planCoverage, testStats, processStats] = await Promise.all([
        this.getRTORPOAnalysis(organizationId).catch(e => {
          this.logger.error(`Error in getRTORPOAnalysis: ${e.message}`, e.stack);
          return { summary: { compliant: 0, atRisk: 0, noStrategy: 0, total: 0 } };
        }),
        this.getPlanCoverage(organizationId).catch(e => {
          this.logger.error(`Error in getPlanCoverage: ${e.message}`, e.stack);
          return { summary: { covered: 0, notCovered: 0, total: 0, coveragePercent: 0 } };
        }),
        this.testsService.getStats(organizationId).catch(e => {
          this.logger.error(`Error getting test stats: ${e.message}`, e.stack);
          return { completed_count: 0, passed_count: 0, issues_count: 0, total: 0, failed_count: 0 };
        }),
        this.processesService.getStats(organizationId).catch(e => {
          this.logger.error(`Error getting process stats: ${e.message}`, e.stack);
          return { overdue_review_count: 0 };
        }),
      ]);

      // Calculate readiness score (0-100)
      const rtoScore = rtoAnalysis?.summary?.total > 0
        ? (rtoAnalysis.summary.compliant / rtoAnalysis.summary.total) * 100
        : 0;

      const planScore = planCoverage?.summary?.coveragePercent || 0;

      const testSuccessRate = testStats?.completed_count > 0
        ? ((Number(testStats.passed_count || 0) + Number(testStats.issues_count || 0)) / Number(testStats.completed_count)) * 100
        : 0;

      const overdueProcessPenalty = processStats?.overdue_review_count > 0
        ? Math.min(20, Number(processStats.overdue_review_count) * 2)
        : 0;

      const readinessScore = Math.max(0, Math.min(100, 
        (rtoScore * 0.3 + planScore * 0.3 + testSuccessRate * 0.3) - overdueProcessPenalty
      ));

      return {
        readinessScore: Math.round(readinessScore),
        metrics: {
          rtoCoverage: Math.round(rtoScore),
          planCoverage: planScore,
          testSuccessRate: Math.round(testSuccessRate),
          overdueItems: Number(processStats?.overdue_review_count || 0),
        },
        breakdown: {
          rto: rtoAnalysis?.summary || { compliant: 0, atRisk: 0, noStrategy: 0, total: 0 },
          plans: planCoverage?.summary || { covered: 0, notCovered: 0, total: 0, coveragePercent: 0 },
          tests: {
            total: Number(testStats?.total || 0),
            completed: Number(testStats?.completed_count || 0),
            passed: Number(testStats?.passed_count || 0),
            failed: Number(testStats?.failed_count || 0),
          },
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get metrics for organization ${organizationId}: ${error.message}`, error.stack);
      return {
        readinessScore: 0,
        metrics: { rtoCoverage: 0, planCoverage: 0, testSuccessRate: 0, overdueItems: 0 },
        breakdown: { rto: { compliant: 0, atRisk: 0, noStrategy: 0, total: 0 }, plans: { covered: 0, notCovered: 0, total: 0, coveragePercent: 0 }, tests: { total: 0, completed: 0, passed: 0, failed: 0 } },
      };
    }
  }
}

