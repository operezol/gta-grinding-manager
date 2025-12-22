import { useState, useCallback, useEffect } from 'react';
import { gtaApi } from '../services/api';
import type { SafeCollection } from '../types';

interface SafeCollectionsState {
  collections: SafeCollection[];
  collectionsByActivityId: Record<string, SafeCollection>;
  loading: boolean;
  error: string | null;
}

export function useSafeCollections() {
  const [state, setState] = useState<SafeCollectionsState>({
    collections: [],
    collectionsByActivityId: {},
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const collections = await gtaApi.getLastCollections();
      const collectionsByActivityId = Object.fromEntries(
        collections.map((c) => [c.activityId, c])
      );
      setState({ collections, collectionsByActivityId, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading safe collections';
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const collectSafe = useCallback(async (activityId: string, moneyCollected: number) => {
    await gtaApi.collectSafe(activityId, moneyCollected);
    await refresh();
  }, [refresh]);

  return {
    collections: state.collections,
    collectionsByActivityId: state.collectionsByActivityId,
    loading: state.loading,
    error: state.error,
    collectSafe,
    refresh,
  };
}
