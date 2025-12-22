import { useCallback, useEffect, useState } from 'react';
import type { Cooldown, Resupply, ProductionState } from '../types';
import { gtaApi } from '../services/api';

type State = {
  cooldowns: Cooldown[];
  resupplies: Resupply[];
  production: ProductionState[];
  loading: boolean;
  error: string | null;
};

export function useCooldowns() {
  const [state, setState] = useState<State>({
    cooldowns: [],
    resupplies: [],
    production: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [cooldowns, resupplies, production] = await Promise.all([
        gtaApi.getActiveCooldowns(),
        gtaApi.getActiveResupply(),
        gtaApi.getAllProduction(),
      ]);
      const nowMs = Date.now();
      const activeCooldowns = cooldowns.filter((c) => {
        const ms = new Date(c.endTime).getTime();
        return Number.isFinite(ms) && ms > nowMs;
      });
      const activeResupplies = resupplies.filter((r) => {
        const ms = new Date(r.endTime).getTime();
        return Number.isFinite(ms) && ms > nowMs;
      });

      console.log('[useCooldowns] Refresh received:', { 
        cooldowns: activeCooldowns.length, 
        resupplies: activeResupplies.length, 
        production: production.length 
      });
      if (activeResupplies.length > 0) {
        console.log('[useCooldowns] Resupplies activityIds:', activeResupplies.map(r => r.activityId));
        console.log('[useCooldowns] Full resupplies:', activeResupplies);
      }
      setState({ cooldowns: activeCooldowns, resupplies: activeResupplies, production, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading cooldowns';
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const nextEndMsCandidates: number[] = [];

    for (const c of state.cooldowns) {
      const ms = new Date(c.endTime).getTime();
      if (!Number.isNaN(ms)) nextEndMsCandidates.push(ms);
    }

    for (const r of state.resupplies) {
      const ms = new Date(r.endTime).getTime();
      if (!Number.isNaN(ms)) nextEndMsCandidates.push(ms);
    }

    if (nextEndMsCandidates.length === 0) return;

    const nextEndMs = Math.min(...nextEndMsCandidates);
    const delayMs = Math.max(0, nextEndMs - Date.now() + 250);

    const t = window.setTimeout(() => {
      refresh();
    }, delayMs);

    return () => {
      window.clearTimeout(t);
    };
  }, [refresh, state.cooldowns, state.resupplies]);

  const startCooldown = useCallback(async (activityId: string, minutes: number) => {
    const endTime = new Date(Date.now() + minutes * 60_000).toISOString();
    await gtaApi.startCooldown({ activityId, endTime });
    await refresh();
  }, [refresh]);

  const clearCooldown = useCallback(async (activityId: string) => {
    const existing = state.cooldowns.find((c) => c.activityId === activityId);
    if (!existing) return;
    await gtaApi.clearCooldown(activityId);
    await refresh();
  }, [refresh, state.cooldowns]);

  const startResupply = useCallback(async (activityId: string, minutes: number) => {
    const endTime = new Date(Date.now() + minutes * 60_000).toISOString();
    await gtaApi.startResupply({ activityId, endTime });
    await refresh();
  }, [refresh]);

  const clearResupply = useCallback(async (activityId: string) => {
    await gtaApi.clearResupply(activityId);
    await refresh();
  }, [refresh]);

  const incrementStock = useCallback(async (activityId: string) => {
    const currentProduction = state.production.find(p => p.activityId === activityId);
    const newStock = (currentProduction?.currentStock || 0) + 1;
    await gtaApi.updateProduction({ activityId, currentStock: newStock });
    await refresh();
  }, [refresh, state.production]);

  const clearProduction = useCallback(async (activityId: string) => {
    await gtaApi.clearProduction(activityId);
    await refresh();
  }, [refresh]);

  return {
    cooldowns: state.cooldowns,
    resupplies: state.resupplies,
    production: state.production,
    loading: state.loading,
    error: state.error,
    refresh,
    startCooldown,
    clearCooldown,
    startResupply,
    clearResupply,
    incrementStock,
    clearProduction,
  };
}
