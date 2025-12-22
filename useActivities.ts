import { useState, useEffect } from 'react';
import { gtaApi } from '../services/api';
import type { Activity, ActivityStats, ActivityWithStats } from '../types';

export const useActivities = () => {
  const [activities, setActivities] = useState<ActivityWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const [activitiesData, statsData] = await Promise.all([
        gtaApi.getActivities(),
        gtaApi.getAllStats()
      ]);

      const activitiesWithStats = activitiesData.map(activity => ({
        ...activity,
        stats: statsData[activity.id] || {
          totalMoney: 0,
          totalTime: 0,
          count: 0,
          dpm: 0
        }
      }));

      setActivities(activitiesWithStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  return { activities, loading, error, refetch: loadActivities };
};