// src/company/company.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Configuration } from '../configuration/configuration.entity';
import { Transactions } from '../transactions/transactions.entity';
import { Target } from '../target/target.entity';
import { User } from '../users/user.entity';

@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Transactions, (transaction) => transaction.company)
  transactions: Transactions[];

  @OneToMany(() => Target, (target) => target.company)
  targets: Target[];

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @Column({ nullable: true })
  logo?: string;

  userCount?: number; 
}
