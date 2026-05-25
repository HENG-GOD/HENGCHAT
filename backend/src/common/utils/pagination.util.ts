export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export function encodeCursor(value: { id: string; createdAt: Date }): string {
  return Buffer.from(`${value.createdAt.toISOString()}|${value.id}`).toString('base64url');
}

export function decodeCursor(cursor?: string): { id: string; createdAt: Date } | null {
  if (!cursor) return null;
  try {
    const [iso, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
    return { id, createdAt: new Date(iso) };
  } catch {
    return null;
  }
}
