import { IsString, IsOptional, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Tier to review frequency mapping
 */
export class TierFrequencyMappingDto {
  @IsString()
  tier_1: string;

  @IsString()
  tier_2: string;

  @IsString()
  tier_3: string;

  @IsString()
  tier_4: string;
}

/**
 * Vendor category definition
 */
export class VendorCategoryDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;
}

/**
 * Risk threshold configuration
 */
export class RiskThresholdsDto {
  very_low: number;
  low: number;
  medium: number;
  high: number;
  critical: number;
}

/**
 * Assessment settings
 */
export class AssessmentSettingsDto {
  @IsOptional()
  requireDocumentUpload?: boolean;

  @IsOptional()
  autoCreateAssessmentOnNewVendor?: boolean;

  @IsOptional()
  @IsString()
  defaultAssessmentType?: string;

  @IsOptional()
  enableAIAnalysis?: boolean;

  @IsOptional()
  notifyOnOverdueReview?: boolean;

  @IsOptional()
  overdueReminderDays?: number;
}

/**
 * Contract settings
 */
export class ContractSettingsDto {
  @IsOptional()
  @IsArray()
  expirationWarningDays?: number[];

  @IsOptional()
  requireSecurityAddendum?: boolean;

  @IsOptional()
  autoRenewNotification?: boolean;
}

/**
 * Full TPRM configuration response
 */
export class TprmConfigurationResponseDto {
  id: string;
  organizationId: string;
  tierFrequencyMapping: TierFrequencyMappingDto;
  vendorCategories: VendorCategoryDto[];
  riskThresholds: RiskThresholdsDto;
  assessmentSettings: AssessmentSettingsDto;
  contractSettings: ContractSettingsDto;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
}

/**
 * Update TPRM configuration
 */
export class UpdateTprmConfigurationDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TierFrequencyMappingDto)
  tierFrequencyMapping?: TierFrequencyMappingDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorCategoryDto)
  vendorCategories?: VendorCategoryDto[];

  @IsOptional()
  @IsObject()
  riskThresholds?: RiskThresholdsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AssessmentSettingsDto)
  assessmentSettings?: AssessmentSettingsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ContractSettingsDto)
  contractSettings?: ContractSettingsDto;
}

