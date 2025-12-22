export function toDate(value: string | Date | undefined | null): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export function getMsRemaining(endTime: string | Date | undefined | null, now = new Date()): number {
  const end = toDate(endTime);
  if (!end) return 0;
  return Math.max(0, end.getTime() - now.getTime());
}

export function getMsElapsed(startTime: string | Date | undefined | null, now = new Date()): number {
  const start = toDate(startTime);
  if (!start) return 0;
  return Math.max(0, now.getTime() - start.getTime());
}
