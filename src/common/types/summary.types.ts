// src/common/types/summary.types.ts

export interface SummaryResult {
  netSales: number;
  cogs: number;
  revenue: number;
  expenses: number;
  cashIn: number;
  cashOut: number;
  operationsCashIn: number;
  operationsCashOut: number;
  investingCashIn: number;
  investingCashOut: number;
  financingCashIn: number;
  financingCashOut: number;
  profitLoss: number;
  salesTarget: number;
  group: string;
  startYear?: number;
  endYear?: number;
  previousMonthSales?: number;
  details?: SummaryResult[];
}

export type NumericSummaryKey =
  | 'netSales'
  | 'cogs'
  | 'revenue'
  | 'expenses'
  | 'cashIn'
  | 'cashOut'
  | 'operationsCashIn'
  | 'operationsCashOut'
  | 'investingCashIn'
  | 'investingCashOut'
  | 'financingCashIn'
  | 'financingCashOut'
  | 'profitLoss'
  | 'salesTarget';
