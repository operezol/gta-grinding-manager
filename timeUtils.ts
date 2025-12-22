export const getTimeRemaining = (endTime: Date): string => {
  const now = new Date();
  const diffMs = endTime.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return 'Completado';
  }
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const isExpired = (endTime: Date): boolean => {
  return new Date() >= endTime;
};

export const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60 * 1000);
};