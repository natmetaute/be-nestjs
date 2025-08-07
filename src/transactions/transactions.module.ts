import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Transactions } from './transactions.entity';
import { TargetModule } from '../target/target.module';

@Module({
  imports: [TypeOrmModule.forFeature([Transactions]), TargetModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
