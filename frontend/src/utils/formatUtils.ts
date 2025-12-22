export function formatMoney(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function formatDurationMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  const pad = (v: number) => String(v).padStart(2, '0');
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}
