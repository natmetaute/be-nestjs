// transactions.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { SummaryDto } from './dto/summary.dto';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private service: TransactionsService) {}

  @Get('summary')
  getSummary(@Query() query: SummaryDto) {
    return this.service.getSummary(query);
  }
}
