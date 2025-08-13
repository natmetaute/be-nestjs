import { Expose } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';
import { TransactionType, TransactionCategory } from '../transactions.entity';

export class CreateTransactionDto {
  @IsOptional()
  @IsString()
  id?: string;

  @Expose()
  @IsNumber()
  amount: number;

  @Expose()
  @IsDateString()
  createdAt: string;

  @Expose()
  @IsEnum(TransactionType)
  type: TransactionType;

  @Expose()
  @IsEnum(TransactionCategory)
  category: TransactionCategory;

  companyId?: number;
}
