import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

import { AuditQueryDto } from './dto/audit-query.dto';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  search(@Query() q: AuditQueryDto) {
    return this.auditService.search({
      entity: q.entity,
      entityId: q.entityId,
      action: q.action,
      from: q.from ? new Date(q.from) : undefined,
      to: q.to ? new Date(q.to) : undefined,
      limit: q.limit ?? 100,
    });
  }
}
