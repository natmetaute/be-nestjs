import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
} from 'typeorm';

@Entity({ name: 'configuration' })
@Unique('UQ_configuration_companyId', ['companyId'])
export class Configuration {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 10 })
  currency!: string;

  @Column({ type: 'varchar', length: 10 })
  language!: string;

  @Column({ unique: true }) // one config per company
  companyId: number;
}
