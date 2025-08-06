import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Transactions,
  TransactionType,
  TransactionCategory,
} from './transactions.entity';
import { SummaryDto } from './dto/summary.dto';
import {
  SummaryResult,
  NumericSummaryKey,
} from '../common/types/summary.types';

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
  ) {}

  async getSummary({
    year,
    month,
    quarter,
  }: SummaryDto): Promise<SummaryResult> {
    const qb = this.repo.createQueryBuilder('t');

    if (year) {
      qb.andWhere('YEAR(t.createdAt) = :year', { year });
    }

    if (month) {
      qb.andWhere('MONTH(t.createdAt) = :month', { month });
    }

    if (quarter) {
      const fromMonth = (quarter - 1) * 3 + 1;
      const toMonth = fromMonth + 2;
      qb.andWhere('MONTH(t.createdAt) BETWEEN :fromMonth AND :toMonth', {
        fromMonth,
        toMonth,
      });
    }

    const data = await qb.getMany();

    const range = await this.repo
      .createQueryBuilder('t')
      .select([
        'MIN(YEAR(t.createdAt)) as min',
        'MAX(YEAR(t.createdAt)) as max',
      ])
      .getRawOne<{ min: number | null; max: number | null }>();

    const startYear = range?.min ?? undefined;
    const endYear = range?.max ?? undefined;

    let previousMonthSales = 0;

    if (year) {
      let prevMonth: number;
      let prevYear: number;

      if (month) {
        // For specific month
        prevMonth = month === 1 ? 12 : month - 1;
        prevYear = month === 1 ? year - 1 : year;
      } else if (quarter) {
        // For quarters: use last month before the quarter starts
        const fromMonth = (quarter - 1) * 3 + 1; // First month of quarter
        prevMonth = fromMonth === 1 ? 12 : fromMonth - 1;
        prevYear = fromMonth === 1 ? year - 1 : year;
      } else {
        // For full-year: use December of the previous year
        prevMonth = 12;
        prevYear = year - 1;
      }

      const prevData = await this.repo
        .createQueryBuilder('t')
        .where(
          'YEAR(t.createdAt) = :prevYear AND MONTH(t.createdAt) = :prevMonth',
          {
            prevYear,
            prevMonth,
          },
        )
        .getMany();

      const summaryPrev = this.buildSummary(prevData, 'Previous');
      previousMonthSales = summaryPrev.netSales;
    }

    const grouped = month ? this.groupByWeek(data) : this.groupByMonth(data);

    const details = Object.entries(grouped).map(([label, groupData]) =>
      this.buildSummary(groupData, label),
    );

    const total = this.buildSummary(
      data,
      this.getPeriodLabel(year, month, quarter),
    );

    total.startYear = startYear;
    total.endYear = endYear;
    total.previousMonthSales = previousMonthSales;
    total.details = details;

    return total;
  }

  private buildSummary(data: Transactions[], group: string): SummaryResult {
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
      salesTarget: 25000 + Math.floor(Math.random() * 5000),
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
}
