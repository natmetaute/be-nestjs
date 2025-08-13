import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from '../company/company.entity';

@Entity()
export class Target {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  year: number;

  @Column({ nullable: true })
  month?: number;

  @Column({ nullable: true })
  quarter?: number;

  @Column('decimal', { precision: 50, scale: 2 })
  amount: number;

  @ManyToOne(() => Company, (company) => company.targets)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ nullable: false })
  companyId: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
