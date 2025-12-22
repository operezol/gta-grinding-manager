import { useState, useCallback } from 'react';
import { gtaApi } from '../services/api';
import type { Session } from '../types';

export const useSessions = () => {
  const [activeSessions, setActiveSessions] = useState<Record<string, Session>>({});

  const startSession = useCallback(async (activityId: string) => {
    const session: Omit<Session, 'id'> = {
      activityId,
      startTime: new Date(),
    };

    try {
      const createdSession = await gtaApi.createSession(session);
      setActiveSessions(prev => ({
        ...prev,
        [activityId]: createdSession
      }));
      return createdSession;
    } catch (error) {
      console.error('Failed to start session:', error);
      throw error;
    }
  }, []);

  const stopSession = useCallback(async (activityId: string, moneyEarned: number) => {
    const session = activeSessions[activityId];
    if (!session) return;

    const endTime = new Date();
    const durationMinutes = (endTime.getTime() - new Date(session.startTime).getTime()) / (1000 * 60);

    try {
      await gtaApi.updateSession(session.id, {
        endTime,
        moneyEarned,
        durationMinutes
      });

      setActiveSessions(prev => {
        const newSessions = { ...prev };
        delete newSessions[activityId];
        return newSessions;
      });
    } catch (error) {
      console.error('Failed to stop session:', error);
      throw error;
    }
  }, [activeSessions]);

  return { activeSessions, startSession, stopSession };
};