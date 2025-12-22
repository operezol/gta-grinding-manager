import { useCallback, useState } from 'react';
import type { Session } from '../types';
import { gtaApi } from '../services/api';

type ActiveSessionsByActivityId = Record<string, Session>;

export function useSessions() {
  const [activeByActivityId, setActiveByActivityId] = useState<ActiveSessionsByActivityId>({});
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(async (activityId: string) => {
    setError(null);
    try {
      const created = await gtaApi.createSession({
        activityId,
        startTime: new Date().toISOString(),
      });
      setActiveByActivityId((prev) => ({ ...prev, [activityId]: created }));
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error starting session';
      setError(message);
      return null;
    }
  }, []);

  const stopSession = useCallback(
    async (activityId: string, moneyEarned?: number) => {
      setError(null);
      const current = activeByActivityId[activityId];
      if (!current) return null;

      try {
        const endTime = new Date();
        const start = new Date(current.startTime as string);
        const durationMinutes = Math.max(0, (endTime.getTime() - start.getTime()) / 60000);

        const updated = await gtaApi.updateSession(current.id, {
          endTime: endTime.toISOString(),
          moneyEarned,
          durationMinutes,
        });
        setActiveByActivityId((prev) => {
          const next = { ...prev };
          delete next[activityId];
          return next;
        });
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error stopping session';
        setError(message);
        return null;
      }
    },
    [activeByActivityId],
  );

  return {
    activeByActivityId,
    error,
    startSession,
    stopSession,
  };
}
