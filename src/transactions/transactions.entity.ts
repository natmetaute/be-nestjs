import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from '../company/company.entity';

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

  @Column({ nullable: true, unique: true })
  externalId?: string;

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

  @ManyToOne(() => Company, (company) => company.transactions)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ nullable: false }) // one config per company
  companyId: number;
}
