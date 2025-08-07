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
import { TargetService } from '../target/target.service';
import * as dayjs from 'dayjs';
import * as isoWeek from 'dayjs/plugin/isoWeek';
import * as weekOfYear from 'dayjs/plugin/weekOfYear';

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

  private getWeeksInMonth(year: number, month: number): number {
    const firstDay = dayjs(new Date(year, month - 1, 1));
    const lastDay = firstDay.endOf('month');

    let current = firstDay.startOf('week');
    const end = lastDay.endOf('week');

    let count = 0;
    while (current.isBefore(end)) {
      count++;
      current = current.add(1, 'week');
    }

    return count;
  }

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
    } else if (quarter) {
      const fromMonth = (quarter - 1) * 3 + 1;
      const toMonth = fromMonth + 2;
      qb.andWhere('MONTH(t.createdAt) BETWEEN :fromMonth AND :toMonth', {
        fromMonth,
        toMonth,
      });
    }

    const data = await qb.getMany();

    if (!year) {
      throw new Error('Year is required to get targets');
    }
    const targets = await this.targetService.getTargetsForYear(year);
    const targetMap = new Map<number, number>();
    targets.forEach((t) => {
      if (t.month && t.amount) {
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
        // Get the first transaction date of the selected month
        const firstTx = await this.repo
          .createQueryBuilder('t')
          .where('YEAR(t.createdAt) = :year AND MONTH(t.createdAt) = :month', {
            year,
            month,
          })
          .orderBy('t.createdAt', 'ASC')
          .getOne();

        if (firstTx) {
          const firstDate = new Date(firstTx.createdAt);
          const previousWeekStart = new Date(firstDate);
          previousWeekStart.setDate(firstDate.getDate() - 7);

          const previousWeekEnd = new Date(firstDate);
          previousWeekEnd.setDate(firstDate.getDate() - 1);

          const prevData = await this.repo
            .createQueryBuilder('t')
            .where('t.createdAt BETWEEN :start AND :end', {
              start: previousWeekStart,
              end: previousWeekEnd,
            })
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
            'YEAR(t.createdAt) = :prevYear AND MONTH(t.createdAt) = :prevMonth',
            {
              prevYear,
              prevMonth,
            },
          )
          .getMany();

        const prevSummary = this.buildSummary(prevData, 'Previous Month');
        previousMonthSales = prevSummary.netSales;
      }
    }

    // Start/end year for context
    const range = await this.repo
      .createQueryBuilder('t')
      .select([
        'MIN(YEAR(t.createdAt)) as min',
        'MAX(YEAR(t.createdAt)) as max',
      ])
      .getRawOne<{ min: number | null; max: number | null }>();

    const startYear = range?.min ?? undefined;
    const endYear = range?.max ?? undefined;

    // Group and build details
    const grouped = month ? this.groupByWeek(data) : this.groupByMonth(data);

    let details: SummaryResult[] = [];

    if (month) {
      const weekCount = Object.keys(grouped).length; // <-- actual weeks with data
      const perWeekTarget = weekCount > 0 ? totalTarget / weekCount : 0;

      details = Object.entries(grouped).map(([label, groupData]) => {
        return this.buildSummary(groupData, label, perWeekTarget);
      });
    } else {
      // Grouping by month (for quarter or year)
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

    // Build final total summary
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
}
