import { Company } from 'src/company/company.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum UserRole {
  Admin = 'Admin',
  BDM = 'BDM',
  User = 'User',
  Viewer = 'Viewer',
}

export enum UserStatus {
  Created = 'Created',
  Active = 'Active',
  Suspended = 'Suspended',
  Deleted = 'Deleted',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.User,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.Created,
  })
  status: UserStatus;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  lastUpdatedDate: Date;

  @ManyToOne(() => Company, (company) => company.users)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ nullable: false })
  companyId: number;
}
