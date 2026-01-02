import { useState, useEffect } from 'react';
import axios from 'axios';

interface ActivityStats {
  id: number;
  name: string;
  total_runs: number;
  avg_duration: number;
  avg_money: number;
  total_money: number;
  total_duration: number;
  money_per_hour: number;
}

const API_BASE = 'http://localhost:3000/api';

export default function StatsPanel() {
  const [stats, setStats] = useState<ActivityStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/activity-stats`);
      setStats(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const getRankClass = (index: number) => {
    if (index === 0) return 'rank-gold';
    if (index === 1) return 'rank-silver';
    if (index === 2) return 'rank-bronze';
    return '';
  };

  if (loading) {
    return <div className="loading-state">Loading statistics...</div>;
  }

  return (
    <div className="stats-panel">
      <div className="panel-header">
        <h2>Activity Rankings</h2>
        <p className="panel-description">
          Activities ranked by average money per hour (highest to lowest)
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {stats.length === 0 ? (
        <div className="empty-state">
          <p>No activity data available yet. Start tracking activities to see rankings!</p>
        </div>
      ) : (
        <div className="rankings-container">
          {stats.map((activity, index) => (
            <div key={activity.id} className={`ranking-card ${getRankClass(index)}`}>
              <div className="ranking-badge">
                {getRankBadge(index)}
              </div>
              <div className="ranking-content">
                <h3 className="activity-name">{activity.name}</h3>
                <div className="ranking-stats">
                  <div className="stat-highlight">
                    <div className="stat-highlight-value">
                      {formatMoney(activity.money_per_hour)}/h
                    </div>
                    <div className="stat-highlight-label">Money per Hour</div>
                  </div>
                  <div className="ranking-details">
                    <div className="detail-item">
                      <span className="detail-label">Total Runs:</span>
                      <span className="detail-value">{activity.total_runs}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Avg Duration:</span>
                      <span className="detail-value">{activity.avg_duration.toFixed(1)} min</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Avg Money:</span>
                      <span className="detail-value">{formatMoney(activity.avg_money)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Total Earned:</span>
                      <span className="detail-value">{formatMoney(activity.total_money)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
