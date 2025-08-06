import { IsOptional, IsInt, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class SummaryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  month?: number; // 1–12

  @IsOptional()
  @Type(() => Number)
  @IsIn([1, 2, 3, 4])
  quarter?: number;
}
