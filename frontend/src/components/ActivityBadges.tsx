import type { Activity } from '../types';
import './ActivityBadges.css';

type Props = {
  activity: Activity;
  compact?: boolean;
};

export default function ActivityBadges({ activity, compact = false }: Props) {
  return (
    <div className={`activity-badges ${compact ? 'compact' : ''}`}>
      {activity.deprecated && (
        <span className="badge badge-deprecated" title="No longer in active dataset">
          ⚠️ Deprecated
        </span>
      )}
      
      {activity.source && activity.source !== 'legacy' && (
        <span className={`badge badge-source badge-source-${activity.source}`} title={`Data source: ${activity.source}`}>
          {activity.source === 'dataset' && '📦'}
          {activity.source === 'wiki' && '🌐'}
          {activity.source === 'manual' && '✏️'}
        </span>
      )}
      
      {activity.solo && (
        <span className="badge badge-solo" title="Can be done solo">
          👤 Solo
        </span>
      )}
      
      {activity.passive && (
        <span className="badge badge-passive" title="Passive income">
          ⏸️ Passive
        </span>
      )}
      
      {(activity.cooldownMinutes ?? activity.minCooldown) && (
        <span className="badge badge-cooldown" title="Has cooldown">
          ⏱️ {activity.cooldownMinutes ?? activity.minCooldown}m
        </span>
      )}
      
      {!activity.avgPayout && !activity.avgTimeMin && (
        <span className="badge badge-no-data" title="No verified metrics yet">
          📊 No data
        </span>
      )}
    </div>
  );
}
