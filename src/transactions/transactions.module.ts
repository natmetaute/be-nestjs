import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Transactions } from './transactions.entity';
import { TargetModule } from '../target/target.module';
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transactions]),
    TargetModule,
    CompanyModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
