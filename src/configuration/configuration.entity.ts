import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from '../company/company.entity';

@Entity({ name: 'configuration' })
export class Configuration {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column({ type: 'varchar' })
  currency!: string;

  @Column({ type: 'varchar' })
  language!: string;

  @OneToOne(() => Company, (company) => company.transactions)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ type: 'integer', nullable: false }) // Explicitly set type for PostgreSQL
  companyId: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
