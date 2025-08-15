// audit.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  Repository,
  ILike,
  FindOptionsWhere,
  FindManyOptions,
} from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';

export type AuditSearchParams = {
  entity: string;
  entityId?: string;
  action?: AuditAction;
  from?: Date;
  to?: Date;
  limit?: number;
};

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async log(params: {
    action: AuditAction;
    entity: string;
    entityId: string | number;
    changes?: unknown;
    userEmail?: string | null;
  }) {
    const log = this.auditRepo.create({
      action: params.action,
      entity: params.entity,
      entityId: String(params.entityId),
      changes: params.changes ? JSON.stringify(params.changes) : undefined,
      userEmail: params.userEmail ?? undefined,
    });
    await this.auditRepo.save(log);
  }

  async search(params: AuditSearchParams): Promise<AuditLog[]> {
    const where: FindOptionsWhere<AuditLog> = { entity: ILike(params.entity) };
    if (params.entityId) where.entityId = params.entityId;
    if (params.action) where.action = params.action;

    const opts: FindManyOptions<AuditLog> = {
      where,
      order: { timestamp: 'DESC' },
      take: params.limit ?? 100,
    };

    if (params.from || params.to) {
      const from = params.from ?? new Date(0);
      const to = params.to ?? new Date();
      (opts.where as FindOptionsWhere<AuditLog>).timestamp = Between(from, to);
    }

    return this.auditRepo.find(opts);
  }

  async findByEntity(entity: string, entityId?: number) {
    const where: FindOptionsWhere<AuditLog> = {
      entity: ILike(entity),
    };

    if (typeof entityId === 'string') {
      where.entityId = entityId;
    }

    return this.auditRepo.find({
      where,
      order: { timestamp: 'DESC' },
    });
  }
}
