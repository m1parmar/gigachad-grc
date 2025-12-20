import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  IsNumber,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

// ===========================================
// ENUMS
// ===========================================

export enum CriticalityTier {
  TIER_1_CRITICAL = 'tier_1_critical',
  TIER_2_ESSENTIAL = 'tier_2_essential',
  TIER_3_IMPORTANT = 'tier_3_important',
  TIER_4_STANDARD = 'tier_4_standard',
}

export enum ImpactLevel {
  CATASTROPHIC = 'catastrophic',
  SEVERE = 'severe',
  MAJOR = 'major',
  MODERATE = 'moderate',
  MINOR = 'minor',
  NEGLIGIBLE = 'negligible',
}

export enum PlanType {
  BUSINESS_CONTINUITY = 'business_continuity',
  DISASTER_RECOVERY = 'disaster_recovery',
  INCIDENT_RESPONSE = 'incident_response',
  CRISIS_COMMUNICATION = 'crisis_communication',
  PANDEMIC_RESPONSE = 'pandemic_response',
  IT_RECOVERY = 'it_recovery',
  DATA_BACKUP = 'data_backup',
  OTHER = 'other',
}

export enum PlanStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  EXPIRED = 'expired',
}

export enum TestType {
  TABLETOP = 'tabletop',
  WALKTHROUGH = 'walkthrough',
  SIMULATION = 'simulation',
  PARALLEL = 'parallel',
  FULL_INTERRUPTION = 'full_interruption',
}

export enum TestStatus {
  PLANNED = 'planned',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
}

export enum TestResult {
  PASSED = 'passed',
  PASSED_WITH_ISSUES = 'passed_with_issues',
  FAILED = 'failed',
  INCOMPLETE = 'incomplete',
}

export enum RunbookStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  NEEDS_REVIEW = 'needs_review',
  ARCHIVED = 'archived',
}

export enum ContactType {
  INTERNAL = 'internal',
  VENDOR = 'vendor',
  CUSTOMER = 'customer',
  REGULATORY = 'regulatory',
  EMERGENCY_SERVICES = 'emergency_services',
  MEDIA = 'media',
  OTHER = 'other',
}

// ===========================================
// BUSINESS PROCESS DTOs
// ===========================================

export class CreateBusinessProcessDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  processId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiProperty({ enum: CriticalityTier })
  @IsEnum(CriticalityTier)
  criticalityTier: CriticalityTier;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  businessCriticalityScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  rtoHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  rpoHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  mtpdHours?: number;

  @ApiPropertyOptional({ enum: ImpactLevel })
  @IsOptional()
  @IsEnum(ImpactLevel)
  financialImpact?: ImpactLevel;

  @ApiPropertyOptional({ enum: ImpactLevel })
  @IsOptional()
  @IsEnum(ImpactLevel)
  operationalImpact?: ImpactLevel;

  @ApiPropertyOptional({ enum: ImpactLevel })
  @IsOptional()
  @IsEnum(ImpactLevel)
  reputationalImpact?: ImpactLevel;

  @ApiPropertyOptional({ enum: ImpactLevel })
  @IsOptional()
  @IsEnum(ImpactLevel)
  regulatoryImpact?: ImpactLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hourlyRevenueImpact?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  dailyRevenueImpact?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  recoveryCostEstimate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  reviewFrequencyMonths?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}

export class UpdateBusinessProcessDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string | null;

  @ApiPropertyOptional({ enum: CriticalityTier })
  @IsOptional()
  @IsEnum(CriticalityTier)
  criticalityTier?: CriticalityTier;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  businessCriticalityScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  rtoHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  rpoHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  mtpdHours?: number;

  @ApiPropertyOptional({ enum: ImpactLevel })
  @IsOptional()
  @IsEnum(ImpactLevel)
  financialImpact?: ImpactLevel;

  @ApiPropertyOptional({ enum: ImpactLevel })
  @IsOptional()
  @IsEnum(ImpactLevel)
  operationalImpact?: ImpactLevel;

  @ApiPropertyOptional({ enum: ImpactLevel })
  @IsOptional()
  @IsEnum(ImpactLevel)
  reputationalImpact?: ImpactLevel;

  @ApiPropertyOptional({ enum: ImpactLevel })
  @IsOptional()
  @IsEnum(ImpactLevel)
  regulatoryImpact?: ImpactLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hourlyRevenueImpact?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  dailyRevenueImpact?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  recoveryCostEstimate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  reviewFrequencyMonths?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class AddProcessDependencyDto {
  @ApiProperty()
  @IsUUID()
  dependencyProcessId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dependencyType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class LinkProcessAssetDto {
  @ApiProperty()
  @IsUUID()
  assetId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relationshipType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// ===========================================
// BC/DR PLAN DTOs
// ===========================================

export class CreateBCDRPlanDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  planId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: PlanType })
  @IsEnum(PlanType)
  planType: PlanType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scopeDescription?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  inScopeProcesses?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outOfScope?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activationCriteria?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activationAuthority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  reviewFrequencyMonths?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}

export class UpdateBCDRPlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: PlanStatus })
  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  versionNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  approverId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scopeDescription?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  inScopeProcesses?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outOfScope?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activationCriteria?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activationAuthority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  reviewFrequencyMonths?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

// ===========================================
// DR TEST DTOs
// ===========================================

export class CreateDRTestDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  testId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: TestType })
  @IsEnum(TestType)
  testType: TestType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  processIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scheduledStartTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  scheduledDurationHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  coordinatorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  testObjectives?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  successCriteria?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scopeDescription?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  systemsInScope?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  participantIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalParticipants?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}

export class UpdateDRTestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TestStatus })
  @IsOptional()
  @IsEnum(TestStatus)
  status?: TestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scheduledStartTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  scheduledDurationHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  coordinatorId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  testObjectives?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  successCriteria?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  participantIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalParticipants?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class RecordTestResultDto {
  @ApiProperty({ enum: TestResult })
  @IsEnum(TestResult)
  result: TestResult;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  actualStartAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  actualEndAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualRecoveryTimeMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  dataLossMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  executiveSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lessonsLearned?: string;
}

export class CreateTestFindingDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  affectedProcessId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  affectedSystem?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  remediationRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remediationPlan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  remediationOwnerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  remediationDueDate?: string;
}

// ===========================================
// RUNBOOK DTOs
// ===========================================

export class CreateRunbookDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  runbookId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  systemName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  processId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  recoveryStrategyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedDurationMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requiredAccessLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prerequisites?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateRunbookDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: RunbookStatus })
  @IsOptional()
  @IsEnum(RunbookStatus)
  status?: RunbookStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  systemName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  processId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedDurationMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requiredAccessLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prerequisites?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class CreateRunbookStepDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  stepNumber: number;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  instructions: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedDurationMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approvalRole?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  verificationSteps?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rollbackSteps?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warnings?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// ===========================================
// COMMUNICATION PLAN DTOs
// ===========================================

export class CreateCommunicationPlanDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  planType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bcdrPlanId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activationTriggers?: string;
}

export class UpdateCommunicationPlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  planType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bcdrPlanId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activationTriggers?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateContactDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  organizationName?: string;

  @ApiProperty({ enum: ContactType })
  @IsEnum(ContactType)
  contactType: ContactType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  primaryPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  secondaryPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  alternateEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timeZone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  roleInPlan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsibilities?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  escalationLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  escalationWaitMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  availabilityHours?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

// ===========================================
// RECOVERY STRATEGY DTOs
// ===========================================

export class CreateRecoveryStrategyDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  strategyType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  processId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recoveryLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recoveryProcedure?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedRecoveryTimeHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requiredPersonnel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requiredEquipment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requiredData?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contractReference?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

// ===========================================
// FILTER DTOs
// ===========================================

export class BusinessProcessFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CriticalityTier })
  @IsOptional()
  @IsEnum(CriticalityTier)
  criticalityTier?: CriticalityTier;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class BCDRPlanFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PlanType })
  @IsOptional()
  @IsEnum(PlanType)
  planType?: PlanType;

  @ApiPropertyOptional({ enum: PlanStatus })
  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class DRTestFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: TestType })
  @IsOptional()
  @IsEnum(TestType)
  testType?: TestType;

  @ApiPropertyOptional({ enum: TestStatus })
  @IsOptional()
  @IsEnum(TestStatus)
  status?: TestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;
}

