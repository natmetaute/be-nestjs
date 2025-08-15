import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../company/company.entity';

@Entity()
export class Target {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column({ type: 'numeric', precision: 24, scale: 2 })
  amount: number;

  @Column({ type: 'integer' })
  year: number;

  @Column({ type: 'integer', nullable: true })
  month: number;

  @Column({ type: 'integer', nullable: true })
  quarter: number;

  @Column({ type: 'integer' })
  companyId: number;

  @ManyToOne(() => Company, (company) => company.targets)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
