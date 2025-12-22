import { useCallback, useEffect, useState } from 'react';
import type { SellSession } from '../types';
import { gtaApi } from '../services/api';

type State = {
  sellSessions: SellSession[];
  loading: boolean;
  error: string | null;
};

export type ActiveSellSessionsByActivityId = Record<string, SellSession>;

export function useSellSessions() {
  const [state, setState] = useState<State>({
    sellSessions: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    try {
      const sellSessions = await gtaApi.getActiveSellSessions();
      setState({ sellSessions, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading sell sessions';
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const startSellSession = useCallback(async (activityId: string) => {
    await gtaApi.createSellSession({ activityId });
    await refresh();
  }, [refresh]);

  const stopSellSession = useCallback(async (sessionId: number, moneyEarned: number, activeMinutes: number) => {
    await gtaApi.updateSellSession(sessionId, { moneyEarned, activeMinutes });
    await refresh();
  }, [refresh]);

  const activeByActivityId: ActiveSellSessionsByActivityId = {};
  for (const session of state.sellSessions) {
    activeByActivityId[session.activityId] = session;
  }

  return {
    sellSessions: state.sellSessions,
    activeByActivityId,
    loading: state.loading,
    error: state.error,
    refresh,
    startSellSession,
    stopSellSession,
  };
}
