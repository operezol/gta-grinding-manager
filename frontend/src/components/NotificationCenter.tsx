import type { PendingNotification } from '../hooks/useNotifications';

type Props = {
  notifications: PendingNotification[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
};

export default function NotificationCenter({ notifications, onDismiss, onClearAll }: Props) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-center">
      <div className="notification-center-header">
        <h3>Notifications ({notifications.length})</h3>
        <button onClick={onClearAll} className="btn-clear-all">
          Clear all
        </button>
      </div>
      <div className="notification-list">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification-item ${notification.type}`}
          >
            <div className="notification-icon">
              {notification.type === 'cooldown' && '✅'}
              {notification.type === 'resupply' && '🔔'}
              {notification.type === 'safe' && '💰'}
              {notification.type === 'passive-ready' && '🏢'}
            </div>
            <div className="notification-content">
              <div className="notification-title">{notification.activityName}</div>
              <div className="notification-message">
                {notification.type === 'cooldown' && 'Available to run'}
                {notification.type === 'resupply' && 'Needs resupply'}
                {notification.type === 'safe' && `Full - Collect ${notification.value ? `$${(notification.value / 1000).toFixed(0)}k` : 'cash'}`}
                {notification.type === 'passive-ready' && `Ready to sell ${notification.value ? `$${(notification.value / 1000).toFixed(0)}k` : ''}`}
              </div>
            </div>
            <button
              onClick={() => onDismiss(notification.id)}
              className="notification-dismiss"
              title="Dismiss"
            >
              ✓
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
