import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';

export class CreateFindingDto {
  @IsString()
  organizationId: string;

  @IsString()
  auditId: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  category: string; // control_deficiency, documentation_gap, process_issue, compliance_gap

  @IsString()
  severity: string; // critical, high, medium, low, observation

  @IsOptional()
  @IsString()
  controlId?: string;

  @IsOptional()
  @IsString()
  requirementRef?: string;

  @IsOptional()
  @IsString()
  remediationPlan?: string;

  @IsOptional()
  @IsString()
  remediationOwner?: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsString()
  rootCause?: string;

  @IsOptional()
  @IsString()
  impact?: string;

  @IsOptional()
  @IsString()
  recommendation?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}





