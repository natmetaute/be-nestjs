import { Expose, Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class CreateTargetDto {
  @Expose()
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined
      ? undefined
      : Number(value),
  )
  @Expose()
  @IsNumber({}, { message: 'amount must be a number' })
  amount: number;

  @Expose()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsNumber({}, { message: 'year must be a number' })
  year: number;

  @Expose()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsNumber({}, { message: 'month must be a number' })
  month: number;

  @Expose()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsNumber({}, { message: 'quarter must be a number' })
  quarter: number;

  @Expose()
  companyId: number;
}
