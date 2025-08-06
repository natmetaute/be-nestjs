import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique /* remove Index here */,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity({ name: 'configuration' })
@Unique('UQ_configuration_userId', ['userId']) // ✅ give it a stable, explicit name
export class Configuration {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 10 })
  currency!: string;

  @Column({ type: 'varchar', length: 10 })
  language!: string;

  @Column()
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
