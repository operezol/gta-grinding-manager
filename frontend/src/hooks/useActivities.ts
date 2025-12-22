import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Activity, ActivityStats, ActivityWithStats } from '../types';
import { gtaApi } from '../services/api';

type State = {
  activities: Activity[];
  statsByActivityId: Record<string, ActivityStats>;
  loading: boolean;
  error: string | null;
};

export function useActivities() {
  const [state, setState] = useState<State>({
    activities: [],
    statsByActivityId: {},
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [activities, statsByActivityId] = await Promise.all([
        gtaApi.getActivities(),
        gtaApi.getAllStats(),
      ]);
      setState({ activities, statsByActivityId, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading activities';
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activitiesWithStats: ActivityWithStats[] = useMemo(() => {
    return state.activities.map((a) => ({
      ...a,
      stats: state.statsByActivityId[a.id] ?? {
        totalMoney: 0,
        totalTime: 0,
        count: 0,
        dpm: 0,
      },
    }));
  }, [state.activities, state.statsByActivityId]);

  return {
    activities: activitiesWithStats,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}
