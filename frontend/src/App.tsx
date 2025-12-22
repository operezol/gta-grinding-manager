import './App.css'
import ActivityGrid from './components/ActivityGrid';
import ActivityFilters from './components/ActivityFilters';
import NotificationCenter from './components/NotificationCenter';
import { useActivities } from './hooks/useActivities';
import { useActivityFilters } from './hooks/useActivityFilters';
import { useCooldowns } from './hooks/useCooldowns';
import { useSessions } from './hooks/useSessions';
import { useSellSessions } from './hooks/useSellSessions';
import { useSafeCollections } from './hooks/useSafeCollections';
import { useNotifications } from './hooks/useNotifications';
import { gtaApi } from './services/api';
import { useEffect } from 'react';

function App() {
  const { activities, loading, error, refresh } = useActivities();
  const { filters, setFilters, filteredActivities } = useActivityFilters(activities);
  const sessions = useSessions();
  const sellSessions = useSellSessions();
  const cooldowns = useCooldowns();
  const safeCollections = useSafeCollections();
  
  // Notifications for cooldowns, resupplies, safes, and passive businesses
  const notifications = useNotifications(
    cooldowns.cooldowns, 
    cooldowns.resupplies, 
    activities,
    sellSessions.sellSessions
  );
  
  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const cooldownsByActivityId = Object.fromEntries(
    cooldowns.cooldowns.map((c) => [c.activityId, c]),
  ) as Record<string, (typeof cooldowns.cooldowns)[number]>;

  const resuppliesByActivityId = Object.fromEntries(
    cooldowns.resupplies.map((r) => [r.activityId, r]),
  ) as Record<string, (typeof cooldowns.resupplies)[number]>;

  const productionByActivityId = Object.fromEntries(
    cooldowns.production.map((p) => [p.activityId, p]),
  ) as Record<string, (typeof cooldowns.production)[number]>;

  const handleCollectSafe = async (activityId: string, moneyCollected: number) => {
    await safeCollections.collectSafe(activityId, moneyCollected);
    await refresh();
  };

  const handleStartSession = async (activityId: string) => {
    await sessions.startSession(activityId);
  };

  const handleStopSession = async (activityId: string, moneyEarned?: number) => {
    await sessions.stopSession(activityId, moneyEarned);

    const activity = activities.find((a) => a.id === activityId);
    if (activity && activity.minCooldown > 0) {
      await cooldowns.startCooldown(activityId, activity.minCooldown);
    }

    await refresh();
    await cooldowns.refresh();
  };

  const handleStartResupply = async (activityId: string, minutes: number) => {
    if (minutes <= 0) return;
    await cooldowns.startResupply(activityId, minutes);
    await cooldowns.refresh();
  };

  const handleStartSell = async (activityId: string) => {
    await sellSessions.startSellSession(activityId);
    await sellSessions.refresh();
  };

  const handleStopSell = async (sessionId: number, moneyEarned: number, activeMinutes: number, activityId: string) => {
    await sellSessions.stopSellSession(sessionId, moneyEarned, activeMinutes);
    // Reset stock to 0 after sell
    await cooldowns.clearProduction(activityId);
    await refresh();
    await cooldowns.refresh();
  };

  const handleResetStats = async (activityId: string) => {
    if (!confirm('Reset all stats for this activity?')) return;
    await gtaApi.resetActivityStats(activityId);
    await refresh();
    await cooldowns.refresh();
    await safeCollections.refresh();
  };

  const handleResetAllStats = async () => {
    const token = prompt('This will delete ALL stats/timers/cooldowns. Type RESET to confirm.');
    if (token !== 'RESET') return;
    await gtaApi.resetAllStats();
    await refresh();
    await cooldowns.refresh();
    await sellSessions.refresh();
    await safeCollections.refresh();
  };

  return (
    <div className="app">
      <header>
        <h1>GTA Online Grinding Manager</h1>
        <div>by Oriol Pérez Olivares</div>
        <button
          onClick={handleResetAllStats}
          className="btn-reset-all"
          title="Delete all stats and reset states"
        >
          Reset all
        </button>
      </header>

      <main>
        {loading && <div className="loading">Loading…</div>}
        {error && <div className="error">{error}</div>}
        {!loading && !error && (
          <>
            <NotificationCenter
              notifications={notifications.pendingNotifications}
              onDismiss={notifications.dismissNotification}
              onClearAll={notifications.clearAllNotifications}
            />
            <ActivityFilters
              activities={activities}
              filters={filters}
              onFiltersChange={setFilters}
            />
            <div className="activities-summary">
              Showing {filteredActivities.length} of {activities.length} activities
            </div>
            <ActivityGrid
              activities={filteredActivities}
              activeSessionsByActivityId={sessions.activeByActivityId}
              activeSellSessionsByActivityId={sellSessions.activeByActivityId}
              cooldownsByActivityId={cooldownsByActivityId}
              resuppliesByActivityId={resuppliesByActivityId}
              productionByActivityId={productionByActivityId}
              safeCollectionsByActivityId={safeCollections.collectionsByActivityId}
              onStartSession={handleStartSession}
              onStopSession={handleStopSession}
              onStartResupply={handleStartResupply}
              onIncrementStock={cooldowns.incrementStock}
              onStartSell={handleStartSell}
              onStopSell={handleStopSell}
              onCollectSafe={handleCollectSafe}
              onResetStats={handleResetStats}
            />
          </>
        )}
      </main>
    </div>
  )
}

export default App
