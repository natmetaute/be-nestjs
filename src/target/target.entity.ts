import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
