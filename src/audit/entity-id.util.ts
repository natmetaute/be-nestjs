import { EntityMetadata } from 'typeorm';

export function extractEntityId(
  metadata: EntityMetadata,
  entityLike?: unknown,
): string | number | null {
  if (!entityLike) return null;
  const idMap = metadata.getEntityIdMap(entityLike as object);
  if (!idMap) return null;
  const values = Object.values(idMap);
  if (values.length === 0) return null;
  return values.length === 1
    ? (values[0] as string | number)
    : values.join('_');
}
