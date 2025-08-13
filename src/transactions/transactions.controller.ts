// transactions.controller.ts
import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  Param,
  InternalServerErrorException,
} from '@nestjs/common';
import { SummaryDto } from './dto/summary.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionsService } from './transactions.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CompanyId } from '../auth/decorators/company-id.decorator';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
interface RowValidationError {
  row: number;
  errors: string[];
}

export async function validateTransactions(
  rows: unknown[], // unknown is safer than any
  companyId: number,
): Promise<{ valid: CreateTransactionDto[]; errors: RowValidationError[] }> {
  const valid: CreateTransactionDto[] = [];
  const errors: RowValidationError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const transaction = plainToInstance(CreateTransactionDto, rows[i], {
      excludeExtraneousValues: true,
    });

    transaction.companyId = companyId;

    const rowErrors = await validate(transaction, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    if (rowErrors.length > 0) {
      errors.push({
        row: i + 1,
        errors: rowErrors
          .map((err) => Object.values(err.constraints || {}))
          .flat(),
      });
    } else {
      valid.push(transaction);
    }
  }

  return { valid, errors };
}

@UseGuards(AuthGuard('jwt'))
@Controller('transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get('summary')
  getSummary(@Query() dto: SummaryDto, @CompanyId() companyId: number) {
    return this.transactionsService.getSummary(dto, companyId);
  }

  @Post('upload/:companyId')
  async uploadTransactions(
    @Param('companyId') companyId: number,
    @Body() transactions: CreateTransactionDto[],
  ) {
    try {
      const { errors } = await validateTransactions(transactions, companyId);

      if (errors.length > 0) {
        return {
          message: 'Validation failed',
          errors,
        };
      }

      const startTime = Date.now();
      const summary = await this.transactionsService.createOrUpdateTransactions(
        transactions,
        companyId,
      );
      const endTime = Date.now();

      return {
        message: 'Transactions processed successfully',
        insertedCount: summary.insertedCount,
        updatedCount: summary.updatedCount,
        updatedRecords: summary.updatedRecords,
        timeMs: endTime - startTime,
      };
    } catch (error) {
      console.error('Error uploading transactions:', error);
      throw new InternalServerErrorException('Failed to upload transactions');
    }
  }
}
