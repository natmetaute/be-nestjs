import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum TransactionType {
  CashIn = 'cashIn',
  CashOut = 'cashOut',
}

export enum TransactionCategory {
  Operations = 'Operations',
  Investment = 'Investment',
  Financing = 'Financing',
}

@Entity()
export class Transactions {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionCategory,
  })
  category: TransactionCategory;

  @Column()
  account_id: string;
}
