import { useMemo, useState } from 'react';
import type { ActivityWithStats } from '../types';
import type { FilterState } from '../components/ActivityFilters';

export function useActivityFilters(activities: ActivityWithStats[]) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    soloOnly: false,
    passiveOnly: false,
    boostableOnly: false,
    tagFilter: '',
    updateFilter: '',
    minRelease: null,
    maxRelease: null,
    profitableOnly: false,
    minEfficiency: null,
    hideDeprecated: true,
    sourceFilter: 'all',
    hasDataOnly: false,
  });

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const nameMatch = activity.name.toLowerCase().includes(search);
        const categoryMatch = activity.category.toLowerCase().includes(search);
        if (!nameMatch && !categoryMatch) return false;
      }

      if (filters.category && activity.category !== filters.category) {
        return false;
      }

      if (filters.soloOnly && !activity.solo) {
        return false;
      }

      if (filters.passiveOnly && !activity.passive) {
        return false;
      }

      if (filters.boostableOnly && !activity.boostable) {
        return false;
      }

      if (filters.tagFilter) {
        if (!activity.tags || !activity.tags.includes(filters.tagFilter)) {
          return false;
        }
      }

      if (filters.updateFilter) {
        if (!activity.update || activity.update !== filters.updateFilter) {
          return false;
        }
      }

      if (filters.minRelease !== null && (activity.release ?? 0) < filters.minRelease) {
        return false;
      }

      if (filters.maxRelease !== null && (activity.release ?? Infinity) > filters.maxRelease) {
        return false;
      }

      if (filters.profitableOnly && (activity.efficiency ?? 0) < 10000) {
        return false;
      }

      if (filters.minEfficiency !== null && (activity.efficiency ?? 0) < filters.minEfficiency) {
        return false;
      }

      // New universal dataset filters
      if (filters.hideDeprecated && activity.deprecated) {
        return false;
      }

      if (filters.sourceFilter !== 'all' && activity.source !== filters.sourceFilter) {
        return false;
      }

      if (filters.hasDataOnly) {
        const hasMetrics = activity.avgPayout != null && activity.avgTimeMin != null;
        if (!hasMetrics) return false;
      }

      return true;
    });
  }, [activities, filters]);

  return {
    filters,
    setFilters,
    filteredActivities: filteredActivities,
  };
}
