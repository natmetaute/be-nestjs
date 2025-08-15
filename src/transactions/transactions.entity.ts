import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
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
  @PrimaryGeneratedColumn({ type: 'integer' }) // Explicitly set type for PostgreSQL
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true }) // Specify varchar and length
  externalId?: string;

  @Column('numeric', { precision: 24, scale: 2 }) // Use 'numeric' for decimal values in PostgreSQL
  amount: number;

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

  @Column({ type: 'integer', nullable: false }) // Explicitly set type for PostgreSQL
  companyId: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
