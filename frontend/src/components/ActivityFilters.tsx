import { useMemo } from 'react';
import type { ActivityWithStats } from '../types';

export interface FilterState {
  search: string;
  category: string;
  soloOnly: boolean;
  passiveOnly: boolean;
  boostableOnly: boolean;
  tagFilter: string;
  updateFilter: string;
  minRelease: number | null;
  maxRelease: number | null;
  profitableOnly: boolean;
  minEfficiency: number | null;
  // New universal dataset filters
  hideDeprecated: boolean;
  sourceFilter: string; // 'all' | 'dataset' | 'wiki' | 'manual' | 'legacy'
  hasDataOnly: boolean; // Only show activities with metrics
}

type Props = {
  activities: ActivityWithStats[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
};

export default function ActivityFilters({ activities, filters, onFiltersChange }: Props) {
  const categories = useMemo(() => {
    const set = new Set(activities.map(a => a.category));
    return Array.from(set).sort();
  }, [activities]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const a of activities) {
      if (a.tags) {
        for (const tag of a.tags) {
          set.add(tag);
        }
      }
    }
    return Array.from(set).sort();
  }, [activities]);

  const allUpdates = useMemo(() => {
    const set = new Set<string>();
    for (const a of activities) {
      if (a.update) {
        set.add(a.update);
      }
    }
    return Array.from(set).sort();
  }, [activities]);

  const yearRange = useMemo(() => {
    const years = activities.map(a => a.release).filter((y): y is number => typeof y === 'number' && y > 0);
    if (years.length === 0) return { min: 2013, max: new Date().getFullYear() };
    return { min: Math.min(...years), max: Math.max(...years) };
  }, [activities]);

  return (
    <div className="activity-filters">
      <div className="filter-row">
        <input
          type="text"
          placeholder="Search activity..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="filter-search"
        />

        <select
          value={filters.category}
          onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
          className="filter-select"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={filters.tagFilter}
          onChange={(e) => onFiltersChange({ ...filters, tagFilter: e.target.value })}
          className="filter-select"
        >
          <option value="">All tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>

        <select
          value={filters.updateFilter}
          onChange={(e) => onFiltersChange({ ...filters, updateFilter: e.target.value })}
          className="filter-select"
        >
          <option value="">All updates</option>
          {allUpdates.map((update) => (
            <option key={update} value={update}>
              {update}
            </option>
          ))}
        </select>

        <select
          value={filters.sourceFilter}
          onChange={(e) => onFiltersChange({ ...filters, sourceFilter: e.target.value })}
          className="filter-select"
        >
          <option value="all">All sources</option>
          <option value="dataset">Dataset</option>
          <option value="wiki">Wiki</option>
          <option value="manual">Manual</option>
          <option value="legacy">Legacy</option>
        </select>
      </div>

      <div className="filter-row">
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filters.soloOnly}
            onChange={(e) => onFiltersChange({ ...filters, soloOnly: e.target.checked })}
          />
          Solo only
        </label>

        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filters.passiveOnly}
            onChange={(e) => onFiltersChange({ ...filters, passiveOnly: e.target.checked })}
          />
          Passive only
        </label>

        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filters.boostableOnly}
            onChange={(e) => onFiltersChange({ ...filters, boostableOnly: e.target.checked })}
          />
          Boostable only
        </label>

        <label className="filter-checkbox filter-profitable">
          <input
            type="checkbox"
            checked={filters.profitableOnly}
            onChange={(e) => onFiltersChange({ ...filters, profitableOnly: e.target.checked })}
          />
          Profitable (≥$10k/min)
        </label>

        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filters.hideDeprecated}
            onChange={(e) => onFiltersChange({ ...filters, hideDeprecated: e.target.checked })}
          />
          Hide deprecated
        </label>

        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filters.hasDataOnly}
            onChange={(e) => onFiltersChange({ ...filters, hasDataOnly: e.target.checked })}
          />
          Has metrics only
        </label>

        <div className="filter-year-range">
          <label>Year:</label>
          <input
            type="number"
            placeholder={`${yearRange.min}`}
            value={filters.minRelease ?? ''}
            onChange={(e) => onFiltersChange({ ...filters, minRelease: e.target.value ? Number(e.target.value) : null })}
            className="filter-year"
            min={yearRange.min}
            max={yearRange.max}
          />
          <span>-</span>
          <input
            type="number"
            placeholder={`${yearRange.max}`}
            value={filters.maxRelease ?? ''}
            onChange={(e) => onFiltersChange({ ...filters, maxRelease: e.target.value ? Number(e.target.value) : null })}
            className="filter-year"
            min={yearRange.min}
            max={yearRange.max}
          />
        </div>

        <div className="filter-efficiency-range">
          <label>Min $/min:</label>
          <input
            type="number"
            placeholder="e.g. 15000"
            value={filters.minEfficiency ?? ''}
            onChange={(e) => onFiltersChange({ ...filters, minEfficiency: e.target.value ? Number(e.target.value) : null })}
            className="filter-efficiency"
            min={0}
            step={1000}
          />
        </div>
      </div>
    </div>
  );
}
