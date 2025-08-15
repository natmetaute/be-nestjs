import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  Transactions,
  TransactionType,
  TransactionCategory,
} from './transactions.entity';
import { SummaryDto } from './dto/summary.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {
  SummaryResult,
  NumericSummaryKey,
} from '../common/types/summary.types';
import { TargetService } from '../target/target.service';
import * as dayjs from 'dayjs';
import * as isoWeek from 'dayjs/plugin/isoWeek';
import * as weekOfYear from 'dayjs/plugin/weekOfYear';
import { Company } from '../company/company.entity';

// Extend the plugins
dayjs.extend(isoWeek as any);
dayjs.extend(weekOfYear as any);

const numericKeys: NumericSummaryKey[] = [
  'netSales',
  'cogs',
  'revenue',
  'expenses',
  'cashIn',
  'cashOut',
  'operationsCashIn',
  'operationsCashOut',
  'investingCashIn',
  'investingCashOut',
  'financingCashIn',
  'financingCashOut',
  'profitLoss',
  'salesTarget',
];

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transactions)
    private readonly repo: Repository<Transactions>,
    private readonly targetService: TargetService,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  private getMonthIndexFromLabel(label: string): number | undefined {
    try {
      const date = new Date(`${label} 1, 2020`);
      const index = date.getMonth() + 1; // Jan = 0 + 1
      return index;
    } catch {
      return undefined;
    }
  }

  async findAllWithFilters(
    page = 1,
    limit = 10,
    search?: string,
    companyId?: number,
  ): Promise<{ data: Transactions[]; total: number }> {
    const where = search
      ? [
          { externalId: Like(`%${search}%`), companyId },
          { createdAt: Like(`%${search}%`), companyId },
        ]
      : [{ companyId }];

    const queryBuilder = this.repo
      .createQueryBuilder('transactions')
      .where(where);

    const result = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getRawAndEntities();

    const entities = result.entities;
    const raw = result.raw;

    if (!Array.isArray(entities) || !Array.isArray(raw)) {
      throw new Error('Expected entities and raw data to be arrays.');
    }

    const mappedData = entities.map((transactions) => ({
      ...transactions,
    }));

    const total = await this.repo
      .createQueryBuilder('transactions')
      .where(where)
      .getCount();

    return { data: mappedData, total };
  }

  async getSummary(
    { year, month, quarter }: SummaryDto,
    companyId: number,
  ): Promise<SummaryResult> {
    const qb = this.repo.createQueryBuilder('t');
    qb.where('t."companyId" = :companyId', { companyId });

    if (year) {
      qb.andWhere('EXTRACT(YEAR FROM t."createdAt") = :year', { year });
    }

    if (month) {
      qb.andWhere('EXTRACT(MONTH FROM t."createdAt") = :month', { month });
    } else if (quarter) {
      const fromMonth = (quarter - 1) * 3 + 1;
      const toMonth = fromMonth + 2;
      qb.andWhere(
        'EXTRACT(MONTH FROM t."createdAt") BETWEEN :fromMonth AND :toMonth',
        { fromMonth, toMonth },
      );
    }

    const data = await qb.getMany();

    if (!year) {
      throw new Error('Year is required to get targets');
    }
    const targets = await this.targetService.getTargetsForYear(year, companyId);
    const targetMap = new Map<number, number>();
    targets.forEach((t) => {
      if (t.month && t.amount && t.companyId === companyId) {
        targetMap.set(t.month, t.amount);
      }
    });

    // Total target for this period
    let totalTarget = 0;
    if (month) {
      totalTarget = targetMap.get(month) ?? 0;
    } else if (quarter) {
      const startMonth = (quarter - 1) * 3 + 1;
      const quarterMonths = [startMonth, startMonth + 1, startMonth + 2];
      totalTarget = quarterMonths.reduce(
        (sum, m) => sum + Number(targetMap.get(m) ?? 0),
        0,
      );
    } else {
      totalTarget = Array.from(targetMap.values()).reduce(
        (sum, val) => sum + Number(val),
        0,
      );
    }

    // Previous month sales
    let previousMonthSales = 0;

    if (year) {
      if (month) {
        // first transaction of the selected month
        const firstTx = await this.repo
          .createQueryBuilder('t')
          .where(
            'EXTRACT(YEAR FROM t."createdAt") = :year AND EXTRACT(MONTH FROM t."createdAt") = :month AND t."companyId" = :companyId',
            { year, month, companyId },
          )
          .orderBy('t."createdAt"', 'ASC')
          .getOne();

        if (firstTx) {
          const firstDate = new Date(firstTx.createdAt);
          const previousWeekStart = new Date(firstDate);
          previousWeekStart.setDate(firstDate.getDate() - 7);

          const previousWeekEnd = new Date(firstDate);
          previousWeekEnd.setDate(firstDate.getDate() - 1);

          const prevData = await this.repo
            .createQueryBuilder('t')
            .where(
              't."createdAt" BETWEEN :start AND :end AND t."companyId" = :companyId',
              { start: previousWeekStart, end: previousWeekEnd, companyId },
            )
            .getMany();

          const prevSummary = this.buildSummary(prevData, 'Previous Week');
          previousMonthSales = prevSummary.netSales;
        }
      } else {
        // Quarter or year
        let prevMonth: number;
        let prevYear: number;

        if (quarter) {
          const fromMonth = (quarter - 1) * 3 + 1;
          prevMonth = fromMonth === 1 ? 12 : fromMonth - 1;
          prevYear = fromMonth === 1 ? year - 1 : year;
        } else {
          prevMonth = 12;
          prevYear = year - 1;
        }

        const prevData = await this.repo
          .createQueryBuilder('t')
          .where(
            'EXTRACT(YEAR FROM t."createdAt") = :prevYear AND EXTRACT(MONTH FROM t."createdAt") = :prevMonth AND t."companyId" = :companyId',
            { prevYear, prevMonth, companyId },
          )
          .getMany();

        const prevSummary = this.buildSummary(prevData, 'Previous Month');
        previousMonthSales = prevSummary.netSales;
      }
    }

    const range = await this.repo
      .createQueryBuilder('t')
      .select([
        `MIN(EXTRACT(YEAR FROM t."createdAt")) AS min`,
        `MAX(EXTRACT(YEAR FROM t."createdAt")) AS max`,
      ])
      .where(`t."companyId" = :companyId`, { companyId })
      .getRawOne<{ min: number | null; max: number | null }>();

    // EXTRACT returns numeric; coerce carefully and handle "no rows"
    const startYear =
      range?.min === null || range?.min === undefined
        ? undefined
        : Number(range.min);
    const endYear =
      range?.max === null || range?.max === undefined
        ? undefined
        : Number(range.max);

    // Group and build details
    const grouped = month ? this.groupByWeek(data) : this.groupByMonth(data);

    let details: SummaryResult[] = [];

    if (month) {
      const weekCount = Object.keys(grouped).length;
      const perWeekTarget = weekCount > 0 ? totalTarget / weekCount : 0;

      details = Object.entries(grouped).map(([label, groupData]) =>
        this.buildSummary(groupData, label, perWeekTarget),
      );
    } else {
      // quarter or year → by month
      details = await Promise.all(
        Object.entries(grouped).map(async ([label, groupData]) => {
          const monthIndex = this.getMonthIndexFromLabel(label);
          const detailTarget = monthIndex
            ? (targetMap.get(monthIndex) ?? 0)
            : 0;
          return this.buildSummary(groupData, label, detailTarget);
        }),
      );
    }

    // Final total summary
    const total = this.buildSummary(
      data,
      this.getPeriodLabel(year, month, quarter),
      totalTarget,
    );

    total.startYear = startYear;
    total.endYear = endYear;
    total.previousMonthSales = previousMonthSales;
    total.details = details;

    return total;
  }

  private buildSummary(
    data: Transactions[],
    group: string,
    salesTarget = 0, // default to 0 if undefined
  ): SummaryResult {
    const summary: SummaryResult = {
      netSales: 0,
      cogs: 0,
      revenue: 0,
      expenses: 0,
      cashIn: 0,
      cashOut: 0,
      operationsCashIn: 0,
      operationsCashOut: 0,
      investingCashIn: 0,
      investingCashOut: 0,
      financingCashIn: 0,
      financingCashOut: 0,
      profitLoss: 0,
      salesTarget,
      group,
    };

    for (const tx of data) {
      const amount = Number(tx.amount);
      const isIn = tx.type === TransactionType.CashIn;
      const category = tx.category.toLowerCase();
      const key = `${category}Cash${isIn ? 'In' : 'Out'}` as NumericSummaryKey;

      if (numericKeys.includes(key)) {
        summary[key] += amount;
      }

      if (isIn) {
        summary.cashIn += amount;
        summary.revenue += amount;
      } else {
        summary.cashOut += amount;
        if (tx.category === TransactionCategory.Operations) {
          summary.expenses += amount;
        }
      }
    }

    summary.netSales = summary.operationsCashIn;
    summary.cogs = summary.operationsCashOut;
    summary.profitLoss = summary.cashIn - summary.cashOut;
    summary.salesTarget = Number(salesTarget ?? 0);

    return summary;
  }

  private groupByMonth(data: Transactions[]): Record<string, Transactions[]> {
    const grouped: Record<string, Transactions[]> = {};

    for (const tx of data) {
      const month = tx.createdAt.toLocaleString('default', { month: 'short' }); // "Jan", "Feb"
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(tx);
    }

    return grouped;
  }

  private groupByWeek(data: Transactions[]): Record<string, Transactions[]> {
    const grouped: Record<string, Transactions[]> = {};

    for (const tx of data) {
      const date = new Date(tx.createdAt);
      const weekNum = Math.floor((date.getDate() - 1) / 7) + 1;
      const label = `Week ${weekNum}`;

      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(tx);
    }

    return grouped;
  }

  private getPeriodLabel(
    year?: number,
    month?: number,
    quarter?: number,
  ): string {
    if (month && year) {
      const date = new Date(year, month - 1);
      return date.toLocaleString('default', { month: 'short' });
    }

    if (quarter && year) {
      return `Q${quarter}`;
    }

    if (year) {
      return `${year}`;
    }

    return 'All Time';
  }

  async createOrUpdateTransactions(
    transactions: CreateTransactionDto[],
    companyId: number,
  ): Promise<{
    insertedCount: number;
    updatedCount: number;
    updatedRecords: Transactions[];
    timeMs: number;
  }> {
    const start = Date.now();

    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });
    if (!company) {
      throw new Error(`Company with ID ${companyId} not found.`);
    }

    const errors: { row: number; errors: string[] }[] = [];

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      const txInstance = plainToInstance(CreateTransactionDto, transaction);
      const validationErrors = await validate(txInstance);
      if (validationErrors.length > 0) {
        errors.push({
          row: i + 1,
          errors: validationErrors.map((ve) =>
            Object.values(ve.constraints || {}).join(', '),
          ),
        });
      }
    }

    if (errors.length > 0) {
      const formattedErrors = errors.map((err) => ({
        row: err.row,
        errors: err.errors,
      }));

      throw new BadRequestException({
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    const inserted: Transactions[] = [];
    const updated: Transactions[] = [];

    for (const transaction of transactions) {
      if (transaction.id) {
        const existing = await this.repo.findOne({
          where: { externalId: transaction.id, companyId },
        });
        if (existing) {
          existing.amount = transaction.amount;
          existing.createdAt = new Date(transaction.createdAt);
          existing.type = transaction.type;
          existing.category = transaction.category;
          await this.repo.save(existing);
          updated.push(existing);
          continue;
        }
      }

      const entity = this.repo.create({
        externalId: transaction.id,
        amount: transaction.amount,
        createdAt: new Date(transaction.createdAt),
        type: transaction.type,
        category: transaction.category,
        company,
        companyId,
      });
      const saved = await this.repo.save(entity);
      inserted.push(saved);
    }

    const end = Date.now();

    return {
      insertedCount: inserted.length,
      updatedCount: updated.length,
      updatedRecords: updated,
      timeMs: end - start,
    };
  }
}
