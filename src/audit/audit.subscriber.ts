// src/audit/audit.subscriber.ts
import {
  DataSource,
  EntityMetadata,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';

/** Make any value safely serializable as a plain object (or null). */
function toPlain(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  try {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  } catch {
    return Object.assign({}, value) as Record<string, unknown>;
  }
}

/** Get a stable id string from an entity using metadata (supports composite keys). */
function extractEntityId(
  metadata: EntityMetadata,
  entityLike?: unknown,
): string | null {
  if (!entityLike || typeof entityLike !== 'object') return null;
  const idMap = metadata.getEntityIdMap(entityLike);
  if (!idMap) return null;
  const vals = Object.values(idMap);
  if (vals.length === 0) return null;
  return vals.length === 1
    ? String(vals[0])
    : vals.map((v) => String(v)).join('_');
}

@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface<object> {
  constructor(private readonly dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  /** Avoid logging AuditLog itself (prevents recursion). */
  private shouldSkip(metadata: EntityMetadata): boolean {
    return metadata.name === 'AuditLog';
  }

  // ---------- INSERT ----------
  async afterInsert(event: InsertEvent<object>): Promise<void> {
    if (this.shouldSkip(event.metadata)) return;
    if (!event.entity) return; // nothing to log

    const repo = event.manager.getRepository(AuditLog);

    // InsertEvent has NO databaseEntity; use the inserted entity only
    const entityId = extractEntityId(event.metadata, event.entity);

    const log = repo.create({
      action: AuditAction.CREATE,
      entity: event.metadata.name,
      entityId: entityId ?? '(unknown)',
      // @CreateDateColumn on AuditLog will set timestamp
      changes: JSON.stringify({
        after: toPlain(event.entity),
      }),
    });

    await repo.save(log);
  }

  // ---------- UPDATE ----------
  async afterUpdate(event: UpdateEvent<object>): Promise<void> {
    if (this.shouldSkip(event.metadata)) return;

    const repo = event.manager.getRepository(AuditLog);

    // UpdateEvent MAY have both "entity" (after) and "databaseEntity" (before)
    const idFromAfter = extractEntityId(event.metadata, event.entity);
    const idFromBefore = extractEntityId(event.metadata, event.databaseEntity);
    const entityId = idFromAfter ?? idFromBefore;

    const changedCols = event.updatedColumns.map((c) => c.propertyName);

    const diff = {
      changed: changedCols,
      before: toPlain(event.databaseEntity ?? null),
      after: toPlain(event.entity ?? null),
    };

    const log = repo.create({
      action: AuditAction.UPDATE,
      entity: event.metadata.name,
      entityId: entityId ?? '(unknown)',
      changes: JSON.stringify(diff),
    });

    await repo.save(log);
  }

  // ---------- DELETE ----------
  async afterRemove(event: RemoveEvent<object>): Promise<void> {
    if (this.shouldSkip(event.metadata)) return;

    const repo = event.manager.getRepository(AuditLog);

    // RemoveEvent can have databaseEntity and/or entityId
    const idFromEntity = extractEntityId(event.metadata, event.entity);
    const idFromBefore = extractEntityId(event.metadata, event.databaseEntity);
    // event.entityId exists but is loosely typed; prefer metadata extraction
    const fallbackId =
      event.entityId != null
        ? String(event.entityId as unknown as string)
        : null;

    const entityId = idFromEntity ?? idFromBefore ?? fallbackId;

    const log = repo.create({
      action: AuditAction.DELETE,
      entity: event.metadata.name,
      entityId: entityId ?? '(unknown)',
      changes: null, // no diff for deletes
    });

    await repo.save(log);
  }
}
