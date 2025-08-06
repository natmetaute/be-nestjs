// src/audit/dto/audit-query.dto.ts
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { AuditAction } from '../audit-log.entity';

export class AuditQueryDto {
  @IsString()
  @IsNotEmpty()
  entity!: string;

  // keep string to support UUID/composite ids
  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @IsDateString()
  from?: string; // ISO 8601

  @IsOptional()
  @IsDateString()
  to?: string; // ISO 8601

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;
}
