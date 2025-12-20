import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsEnum, IsBoolean, IsDateString, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum TrainingStatus {
  not_started = 'not_started',
  in_progress = 'in_progress',
  completed = 'completed',
}

export enum AssignmentStatus {
  pending = 'pending',
  in_progress = 'in_progress',
  completed = 'completed',
  overdue = 'overdue',
}

// ==========================================
// Training Progress DTOs
// ==========================================

export class UpdateProgressDto {
  @ApiPropertyOptional({ enum: TrainingStatus })
  @IsOptional()
  @IsEnum(TrainingStatus)
  status?: TrainingStatus;

  @ApiPropertyOptional({ description: 'Quiz score (0-100)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiPropertyOptional({ description: 'Slide progress percentage (0-100)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  slideProgress?: number;

  @ApiPropertyOptional({ description: 'Time spent in minutes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpent?: number;
}

export class StartModuleDto {
  @ApiProperty({ description: 'Static module ID from training catalog' })
  @IsString()
  moduleId: string;
}

export class CompleteModuleDto {
  @ApiProperty({ description: 'Static module ID from training catalog' })
  @IsString()
  moduleId: string;

  @ApiPropertyOptional({ description: 'Quiz score (0-100)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;
}

// ==========================================
// Training Assignment DTOs
// ==========================================

export class CreateAssignmentDto {
  @ApiProperty({ description: 'User ID to assign training to' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Training module ID' })
  @IsString()
  moduleId: string;

  @ApiPropertyOptional({ description: 'Due date for completion' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Whether this assignment is required' })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class BulkAssignDto {
  @ApiProperty({ description: 'User IDs to assign training to', type: [String] })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @ApiProperty({ description: 'Training module IDs to assign', type: [String] })
  @IsArray()
  @IsString({ each: true })
  moduleIds: string[];

  @ApiPropertyOptional({ description: 'Due date for completion' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Whether assignments are required' })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class UpdateAssignmentDto {
  @ApiPropertyOptional({ enum: AssignmentStatus })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @ApiPropertyOptional({ description: 'Due date for completion' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Whether this assignment is required' })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

// ==========================================
// Training Campaign DTOs
// ==========================================

export class CreateCampaignDto {
  @ApiProperty({ description: 'Campaign name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Campaign description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Training module IDs to include', type: [String] })
  @IsArray()
  @IsString({ each: true })
  moduleIds: string[];

  @ApiProperty({ description: 'Target groups (department names or "all")', type: [String] })
  @IsArray()
  @IsString({ each: true })
  targetGroups: string[];

  @ApiProperty({ description: 'Campaign start date' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'Campaign end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Whether campaign is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCampaignDto {
  @ApiPropertyOptional({ description: 'Campaign name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Campaign description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Training module IDs to include', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  moduleIds?: string[];

  @ApiPropertyOptional({ description: 'Target groups (department names or "all")', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetGroups?: string[];

  @ApiPropertyOptional({ description: 'Campaign end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Whether campaign is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ==========================================
// Response Types
// ==========================================

export class TrainingProgressResponse {
  id: string;
  moduleId: string;
  userId: string;
  status: string;
  startedAt?: Date;
  completedAt?: Date;
  score?: number;
  slideProgress: number;
  timeSpent: number;
  lastAccessedAt?: Date;
}

export class TrainingStatsResponse {
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  totalTimeSpent: number;
  averageScore: number;
  certificationsEarned: number;
  streak: number;
  xp: number;
  level: number;
}

export class CampaignStatsResponse {
  totalAssignments: number;
  completedAssignments: number;
  overdueAssignments: number;
  averageCompletionRate: number;
  averageScore: number;
}




