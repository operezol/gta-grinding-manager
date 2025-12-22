export const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDPM = (dpm: number): string => {
  return `${formatMoney(dpm)}/min`;
};

export const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

export const formatDuration = (startTime: Date, endTime?: Date): string => {
  const end = endTime || new Date();
  const durationMs = end.getTime() - new Date(startTime).getTime();
  const durationMinutes = Math.floor(durationMs / (1000 * 60));
  return formatTime(durationMinutes);
};