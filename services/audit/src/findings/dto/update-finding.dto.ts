import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';

export class UpdateFindingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsString()
  status?: string; // open, acknowledged, remediation_planned, remediation_in_progress, resolved, accepted_risk

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
  @IsDateString()
  actualDate?: string;

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
  @IsString()
  managementResponse?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}





