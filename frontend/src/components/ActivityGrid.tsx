import { Fragment, useEffect, useMemo, useState } from 'react';
import type { ActivityWithStats } from '../types';
import type { Cooldown, ProductionState, Resupply, Session, SellSession, SafeCollection } from '../types';
import { formatDurationMs, formatMoney } from '../utils/formatUtils';
import { getMsElapsed, getMsRemaining } from '../utils/timeUtils';
import ActivityTooltip from './ActivityTooltip';
import ActivityBadges from './ActivityBadges';

type Props = {
  activities: ActivityWithStats[];
  activeSessionsByActivityId: Record<string, Session | undefined>;
  activeSellSessionsByActivityId: Record<string, SellSession | undefined>;
  cooldownsByActivityId: Record<string, Cooldown | undefined>;
  resuppliesByActivityId: Record<string, Resupply | undefined>;
  productionByActivityId: Record<string, ProductionState | undefined>;
  safeCollectionsByActivityId: Record<string, SafeCollection | undefined>;
  onStartSession: (activityId: string) => void;
  onStopSession: (activityId: string, moneyEarned?: number) => void;
  onStartResupply: (activityId: string, minutes: number) => void;
  onIncrementStock: (activityId: string) => void;
  onStartSell: (activityId: string) => void;
  onStopSell: (sessionId: number, moneyEarned: number, activeMinutes: number, activityId: string) => void;
  onCollectSafe: (activityId: string, moneyCollected: number) => void;
  onResetStats: (activityId: string) => void;
};

type SortConfig = {
  key: keyof ActivityWithStats;
  direction: 'asc' | 'desc';
} | null;

export default function ActivityGrid({
  activities,
  activeSessionsByActivityId,
  activeSellSessionsByActivityId,
  cooldownsByActivityId,
  resuppliesByActivityId,
  productionByActivityId,
  safeCollectionsByActivityId,
  onStartSession,
  onStopSession,
  onStartResupply,
  onIncrementStock,
  onStartSell,
  onStopSell,
  onCollectSafe,
  onResetStats,
}: Props) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'efficiency', direction: 'desc' });
  const [pausedSellSessions, setPausedSellSessions] = useState<Record<string, { sessionId: number; pausedAt: Date; elapsedMinutes: number }>>({});
  const [pausedSessions, setPausedSessions] = useState<Record<string, { sessionId: string; pausedAt: Date; elapsedMinutes: number }>>({});

  const handleSort = (key: keyof ActivityWithStats) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return null;
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedActivities = useMemo(() => {
    if (!sortConfig) return activities;

    return [...activities].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [activities, sortConfig]);
  const [moneyByActivityId, setMoneyByActivityId] = useState<Record<string, string>>({});
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setMoneyByActivityId((prev) => {
      const next = { ...prev };
      for (const a of activities) {
        const current = next[a.id];
        if (current === undefined || String(current).trim() === '') {
          next[a.id] = String(a.avgPayout ?? 0);
        }
      }
      return next;
    });
  }, [activities]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="activity-grid-container">
      <div className="activity-grid">
        <div className="grid-header sortable" onClick={() => handleSort('name')}>
          Activity {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
        </div>
        <div className="grid-header sortable" onClick={() => handleSort('efficiency')}>
          $/min {sortConfig?.key === 'efficiency' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
        </div>
        <div className="grid-header sortable" onClick={() => handleSort('avgPayout')}>
          Payout {sortConfig?.key === 'avgPayout' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
        </div>
        <div className="grid-header sortable" onClick={() => handleSort('avgTimeMin')}>
          Time {sortConfig?.key === 'avgTimeMin' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
        </div>
        <div className="grid-header">Sessions</div>
        <div className="grid-header">Total $</div>
        <div className="grid-header">Control / Status</div>
        <div className="grid-header">Reset</div>

        {sortedActivities.map((a) => (
        <Fragment key={a.id}>
          <div key={`${a.id}-name`} className={`grid-cell cell-name ${a.deprecated ? 'deprecated' : ''}`}>
            <ActivityTooltip activity={a}>
              <div className="activity-name-wrapper">
                <span className="activity-name-text">{a.name}</span>
                <ActivityBadges activity={a} compact />
              </div>
            </ActivityTooltip>
          </div>
          <div key={`${a.id}-efficiency`} className={`grid-cell cell-efficiency ${(a.efficiency ?? 0) > 15000 ? 'high' : (a.efficiency ?? 0) > 8000 ? 'medium' : ''}`}>
            {(() => {
              const efficiency = a.stats.count > 0 ? a.stats.dpm : (a.efficiency ?? 0);
              return efficiency > 0 ? `$${formatMoney(efficiency)}` : '-';
            })()}
          </div>
          <div key={`${a.id}-payout`} className="grid-cell cell-payout">
            {(() => {
              const avgPayout = a.stats.count > 0 
                ? Math.round(a.stats.totalMoney / a.stats.count)
                : (a.avgPayout ?? 0);
              return avgPayout > 0 ? `$${formatMoney(avgPayout)}` : '-';
            })()}
          </div>
          <div key={`${a.id}-time`} className="grid-cell">
            {(() => {
              const avgTimeMinutes = a.stats.count > 0
                ? (a.stats.totalTime / a.stats.count)
                : (a.avgTimeMin ?? 0);

              if (!avgTimeMinutes || avgTimeMinutes <= 0) return '-';
              if (avgTimeMinutes < 1) {
                const seconds = Math.max(1, Math.round(avgTimeMinutes * 60));
                return `${seconds}s`;
              }
              return `${avgTimeMinutes.toFixed(1)}m`;
            })()}
          </div>
          <div key={`${a.id}-sessions`} className="grid-cell cell-stats">
            {a.stats.count > 0 ? a.stats.count : '-'}
          </div>
          <div key={`${a.id}-total`} className="grid-cell cell-stats">
            {a.stats.totalMoney > 0 ? `$${formatMoney(a.stats.totalMoney)}` : '-'}
          </div>

          <div key={`${a.id}-control`} className="grid-cell control-cell">
            {(() => {
              const cooldown = cooldownsByActivityId[a.id];
              const resupply = resuppliesByActivityId[a.id];
              const activeSession = activeSessionsByActivityId[a.id];
              const pausedSession = pausedSessions[a.id];
              
              // Session paused - show Input + Confirmar button
              if (pausedSession) {
                return (
                  <div className="paused-state">
                    <input
                      type="number"
                      value={moneyByActivityId[a.id] ?? ''}
                      placeholder="$ Money earned"
                      onChange={(e) => setMoneyByActivityId((prev) => ({ ...prev, [a.id]: e.target.value }))}
                      className="money-input"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        const raw = moneyByActivityId[a.id];
                        const trimmed = raw ? String(raw).trim() : '';
                        const moneyEarned = trimmed !== '' ? Number(trimmed) : 0;
                        
                        if (moneyEarned === 0) {
                          alert('Please enter the money earned before confirming');
                          return;
                        }
                        
                        onStopSession(a.id, moneyEarned);
                        setPausedSessions(prev => {
                          const next = { ...prev };
                          delete next[a.id];
                          return next;
                        });
                      }}
                      className="btn-confirm"
                    >
                      Confirm
                    </button>
                  </div>
                );
              }
              
              // Active session - show Stop button
              if (activeSession) {
                const elapsed = formatDurationMs(getMsElapsed(activeSession.startTime, now));
                const openMoneyInput = () => {
                  const elapsedMs = getMsElapsed(activeSession.startTime, now);
                  const activeMinutes = Math.round(elapsedMs / 60000);
                  setPausedSessions(prev => ({
                    ...prev,
                    [a.id]: {
                      sessionId: activeSession.id,
                      pausedAt: new Date(),
                      elapsedMinutes: activeMinutes
                    }
                  }));
                };

                if (a.category === 'heist') {
                  return (
                    <button
                      onClick={openMoneyInput}
                      className="btn-stop"
                    >
                      {elapsed}
                    </button>
                  );
                }
                return (
                  <button
                    onClick={() => {
                      openMoneyInput();
                    }}
                    className="btn-stop"
                  >
                    Stop {elapsed}
                  </button>
                );
              }
              
              // Cooldown active - show countdown
              if (cooldown) {
                const remainingMs = getMsRemaining(cooldown.endTime, now);
                if (remainingMs <= 0) return null;
                const remaining = formatDurationMs(remainingMs);
                return <div className="status-waiting">⏳ {remaining}</div>;
              }
              
              // Resupply active - show countdown
              if (resupply) {
                const remainingMs = getMsRemaining(resupply.endTime, now);
                if (remainingMs <= 0) return null;
                const remaining = formatDurationMs(remainingMs);
                return <div className="status-waiting">🔄 {remaining}</div>;
              }
              
              // Passive business WITHOUT resupplies (Nightclub, Money Fronts) - auto-produces
              if (a.passive && (!(a.resupplyMin ?? 0) || (a.resupplyMin ?? 0) === 0)) {
                // Check if this is a safe FIRST (before any sell session logic)
                // Detect by tag OR by name containing "Safe"
                const isSafe = a.tags?.some(tag => tag.toLowerCase().includes('safe')) || 
                               a.name.toLowerCase().includes('safe');
                
                if (isSafe) {
                  // Safe collection logic: check if ready to collect
                  const lastCollection = safeCollectionsByActivityId[a.id];
                  const avgTimeMinutes = a.avgTimeMin ?? 0;
                  
                  if (lastCollection && avgTimeMinutes > 0) {
                    const collectedAt = new Date(lastCollection.collectedAt);
                    const nextCollectionTime = new Date(collectedAt.getTime() + avgTimeMinutes * 60_000);
                    const msRemaining = nextCollectionTime.getTime() - now.getTime();
                    
                    if (msRemaining > 0) {
                      // Still filling - show countdown
                      const remaining = formatDurationMs(msRemaining);
                      return <div className="status-waiting">⏱️ {remaining}</div>;
                    }
                  }
                  
                  // Safe is ready to collect
                  return (
                    <button
                      onClick={() => {
                        onCollectSafe(a.id, a.avgPayout ?? 0);
                      }}
                      className="btn-collect"
                    >
                      Collect ${formatMoney(a.avgPayout ?? 0)}
                    </button>
                  );
                }
                
                // Regular passive business - ready to sell
                return (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMoneyByActivityId((prev) => ({ ...prev, [a.id]: String(a.avgPayout ?? 0) }));
                      onStartSell(a.id);
                    }}
                    className="btn-sell"
                  >
                    Sell
                  </button>
                );
              }
              
              // Passive business WITH resupplies (MC, Bunker, Acid Lab)
              if (a.passive && (a.resupplyMin ?? 0) > 0) {
                const production = productionByActivityId[a.id];
                const currentStock = production?.currentStock || 0;
                const maxStock = a.maxStock ?? 5;
                const isFull = currentStock >= maxStock;
                const sellSession = activeSellSessionsByActivityId[a.id];
                
                // Sell session paused - show Input + Confirmar button
                const pausedSession = pausedSellSessions[a.id];
                if (pausedSession) {
                  return (
                    <div className="paused-state">
                      <input
                        type="number"
                        value={moneyByActivityId[a.id] ?? ''}
                        placeholder="$ Sale amount"
                        onChange={(e) => setMoneyByActivityId((prev) => ({ ...prev, [a.id]: e.target.value }))}
                        className="money-input"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          const raw = moneyByActivityId[a.id];
                          const trimmed = raw ? String(raw).trim() : '';
                          const moneyEarned = trimmed !== '' ? Number(trimmed) : 0;
                          
                          if (moneyEarned === 0) {
                            alert('Please enter the sale amount before confirming');
                            return;
                          }
                          
                          onStopSell(pausedSession.sessionId, moneyEarned, pausedSession.elapsedMinutes, a.id);
                          setPausedSellSessions(prev => {
                            const next = { ...prev };
                            delete next[a.id];
                            return next;
                          });
                        }}
                        className="btn-confirm"
                      >
                        Confirm Sale
                      </button>
                    </div>
                  );
                }
                
                // Sell session active - show Stop button with timer
                if (sellSession) {
                  const elapsed = formatDurationMs(getMsElapsed(sellSession.startTime, now));
                  return (
                    <button
                      onClick={() => {
                        const elapsedMs = getMsElapsed(sellSession.startTime, now);
                        const activeMinutes = Math.round(elapsedMs / 60000);
                        setPausedSellSessions(prev => ({
                          ...prev,
                          [a.id]: {
                            sessionId: Number(sellSession.id),
                            pausedAt: new Date(),
                            elapsedMinutes: activeMinutes
                          }
                        }));
                      }}
                      className="btn-stop"
                    >
                      Stop {elapsed}
                    </button>
                  );
                }
                
                // Stock full - ready to sell
                if (isFull) {
                  return (
                    <button
                      onClick={() => {
                        setMoneyByActivityId((prev) => ({ ...prev, [a.id]: String(a.avgPayout ?? 0) }));
                        onStartSell(a.id);
                      }}
                      className="btn-sell"
                    >
                      Sell ({currentStock}/{maxStock})
                    </button>
                  );
                }
                
                // Resupplying
                return (
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const btn = e.currentTarget;
                      if (btn.disabled) return;
                      btn.disabled = true;
                      
                      console.log(`[Resupply] Starting for ${a.name}, stock: ${currentStock}/${maxStock}`);
                      await onStartResupply(a.id, a.resupplyMin ?? 0);
                      console.log(`[Resupply] Incrementing stock`);
                      await onIncrementStock(a.id);
                      console.log(`[Resupply] Completed for ${a.name}`);
                      
                      setTimeout(() => { btn.disabled = false; }, 1000);
                    }}
                    className="btn-resupply"
                  >
                    Resupply ({currentStock}/{maxStock})
                  </button>
                );
              }
              
              // Default: Start button for all other activities (including those with cooldown)
              return (
                <button
                  onClick={() => {
                    setMoneyByActivityId((prev) => {
                      const current = prev[a.id];
                      if (current === undefined || String(current).trim() === '') {
                        return { ...prev, [a.id]: String(a.avgPayout ?? 0) };
                      }
                      return prev;
                    });
                    onStartSession(a.id);
                  }}
                  className="btn-start"
                >
                  Start
                </button>
              );
            })()}
          </div>
          <div key={`${a.id}-reset`} className="grid-cell">
            <button
              onClick={() => onResetStats(a.id)}
              className="btn-reset-stats"
              disabled={a.stats.count === 0}
              title={a.stats.count === 0 ? 'No stats' : 'Reset stats'}
            >
              🔄
            </button>
          </div>
        </Fragment>
        ))}
      </div>
    </div>
  );
}
