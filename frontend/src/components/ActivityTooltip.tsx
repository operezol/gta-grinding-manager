import { useState } from 'react';
import type { ActivityWithStats } from '../types';

type Props = {
  activity: ActivityWithStats;
  children: React.ReactNode;
};

export default function ActivityTooltip({ activity, children }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  const lastSessionLabel = (() => {
    const raw = activity.stats.lastSession;
    if (!raw) return null;
    const d = raw instanceof Date ? raw : new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString();
  })();

  const playersLabel = (() => {
    const min = activity.playersMin;
    const max = activity.playersMax;
    if (min == null && max == null) return null;
    if (min != null && max != null) {
      return min === max ? String(min) : `${min}-${max}`;
    }
    return min != null ? `min ${min}` : `max ${max}`;
  })();

  return (
    <div 
      className="tooltip-container"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="custom-tooltip">
          <div className="stats-section">
            <div className="tooltip-content">
              <div className="tooltip-line">Category: {activity.category}</div>
              {activity.deprecated && <div className="tooltip-line" style={{color: '#ff6b6b'}}>⚠️ Deprecated (not in current dataset)</div>}
              {activity.source && <div className="tooltip-line">Source: {activity.source}</div>}
              {activity.release ? <div className="tooltip-line">Release year: {activity.release}</div> : null}
              {playersLabel ? <div className="tooltip-line">Players: {playersLabel}</div> : null}
              {activity.solo != null && <div className="tooltip-line">Solo: {activity.solo ? 'Yes' : 'No'}</div>}
              {activity.passive != null && <div className="tooltip-line">Passive: {activity.passive ? 'Yes' : 'No'}</div>}
              {activity.boostable != null && <div className="tooltip-line">Boostable: {activity.boostable ? 'Yes' : 'No'}</div>}
              {(activity.cooldownMinutes ?? activity.minCooldown) && <div className="tooltip-line">Cooldown: {activity.cooldownMinutes ?? activity.minCooldown} min</div>}
              {activity.resupplyMin && <div className="tooltip-line">Resupply: {activity.resupplyMin} min</div>}
              {activity.productionMinutes && <div className="tooltip-line">Production time: {activity.productionMinutes} min</div>}
              {activity.supplyConsumptionMinutes && <div className="tooltip-line">Supply duration: {activity.supplyConsumptionMinutes} min</div>}
              {activity.maxStorage && <div className="tooltip-line">Max storage: ${activity.maxStorage.toLocaleString()}</div>}
              {activity.maxStock && <div className="tooltip-line">Max stock: {activity.maxStock}</div>}
              {activity.stockValue && <div className="tooltip-line">Stock value: ${activity.stockValue.toLocaleString()}</div>}
              {activity.tags?.length ? <div className="tooltip-line">Tags: {activity.tags.join(', ')}</div> : null}
              {activity.update ? <div className="tooltip-line">Update: {activity.update}</div> : null}
              {activity.sourceUrl ? <div className="tooltip-line">Wiki: {activity.sourceUrl}</div> : null}
              {lastSessionLabel ? <div className="tooltip-line">Last run: {lastSessionLabel}</div> : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
