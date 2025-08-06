// src/audit/audit-log.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  AUTH_LOGIN = 'AUTH_LOGIN',
  AUTH_LOGOUT = 'AUTH_LOGOUT',
  AUTH_LOGIN_FAILED = 'AUTH_LOGIN_FAILED',
  AUTH_REGISTER = 'AUTH_REGISTER',
}

@Entity({ name: 'audit_log' })
export class AuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ type: 'enum', enum: AuditAction })
  action!: AuditAction;

  @Column({ type: 'varchar', length: 191 })
  entity!: string;

  // Use string if you support UUID/composite keys; use bigint if all numeric
  @Column({ type: 'varchar', length: 191 })
  entityId!: string;

  @CreateDateColumn({
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  timestamp!: Date;

  @Column({ type: 'longtext', nullable: true })
  changes!: string | null;

  // ✅ Make the type explicit so TypeORM doesn’t infer "Object"
  @Column({ type: 'varchar', length: 191, nullable: true })
  userEmail!: string | null; // keep this as string|null, not object
}
