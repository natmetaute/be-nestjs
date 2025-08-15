// src/company/company.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Transactions } from '../transactions/transactions.entity';
import { Target } from '../target/target.entity';
import { User } from '../users/user.entity';

@Entity()
export class Company {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @OneToMany(() => Transactions, (transaction) => transaction.company)
  transactions: Transactions[];

  @OneToMany(() => Target, (target) => target.company)
  targets: Target[];

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @Column({ nullable: true })
  logo?: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;

  userCount?: number;
}
