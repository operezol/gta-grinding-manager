import { useState, useEffect } from 'react';
import axios from 'axios';

interface ActivityType {
  id: number;
  name: string;
  created_at: string;
}

interface ActivityRun {
  id: number;
  activity_type_id: number;
  duration: number;
  money: number;
  timestamp: string;
}

interface RunStats {
  totalRuns: number;
  avgDuration: number;
  avgMoney: number;
  avgMoneyPerHour: number;
  totalMoney: number;
  totalDuration: number;
}

const API_BASE = 'http://localhost:3000/api';

export default function ActivitiesPanel() {
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
  const [runs, setRuns] = useState<ActivityRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newActivityName, setNewActivityName] = useState('');
  const [showNewActivityForm, setShowNewActivityForm] = useState(false);

  const [runDuration, setRunDuration] = useState('');
  const [runMoney, setRunMoney] = useState('');

  const [editingRunId, setEditingRunId] = useState<number | null>(null);
  const [editDuration, setEditDuration] = useState('');
  const [editMoney, setEditMoney] = useState('');

  // Chronometer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [useChronometer, setUseChronometer] = useState(true);

  useEffect(() => {
    loadActivityTypes();
  }, []);

  useEffect(() => {
    if (selectedActivity) {
      loadRuns(selectedActivity.id);
    }
  }, [selectedActivity]);

  // Chronometer effect
  useEffect(() => {
    let interval: number | null = null;
    
    if (isTimerRunning && timerStartTime) {
      interval = window.setInterval(() => {
        setElapsedTime(Date.now() - timerStartTime);
      }, 100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerStartTime]);

  const loadActivityTypes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/activity-types`);
      setActivityTypes(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load activities');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRuns = async (activityId: number) => {
    try {
      const response = await axios.get(`${API_BASE}/activity-types/${activityId}/runs`);
      setRuns(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load runs');
      console.error(err);
    }
  };

  const createActivityType = async () => {
    if (!newActivityName.trim()) return;

    try {
      const response = await axios.post(`${API_BASE}/activity-types`, {
        name: newActivityName.trim()
      });
      setActivityTypes([...activityTypes, response.data]);
      setNewActivityName('');
      setShowNewActivityForm(false);
      setSelectedActivity(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create activity');
    }
  };

  const startChronometer = () => {
    setTimerStartTime(Date.now());
    setIsTimerRunning(true);
    setElapsedTime(0);
  };

  const stopChronometer = () => {
    setIsTimerRunning(false);
    const durationInMinutes = elapsedTime / 60000;
    setRunDuration(durationInMinutes.toFixed(2));
  };

  const resetChronometer = () => {
    setIsTimerRunning(false);
    setTimerStartTime(null);
    setElapsedTime(0);
    setRunDuration('');
  };

  const formatChronometer = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  const addRun = async () => {
    if (!selectedActivity || !runDuration || !runMoney) return;

    try {
      await axios.post(`${API_BASE}/activity-types/${selectedActivity.id}/runs`, {
        duration: parseFloat(runDuration),
        money: parseFloat(runMoney)
      });
      setRunDuration('');
      setRunMoney('');
      resetChronometer();
      loadRuns(selectedActivity.id);
      setError('');
    } catch (err) {
      setError('Failed to add run');
    }
  };

  const startEditRun = (run: ActivityRun) => {
    setEditingRunId(run.id);
    setEditDuration(run.duration.toString());
    setEditMoney(run.money.toString());
  };

  const saveEditRun = async (runId: number) => {
    try {
      await axios.put(`${API_BASE}/runs/${runId}`, {
        duration: parseFloat(editDuration),
        money: parseFloat(editMoney)
      });
      setEditingRunId(null);
      if (selectedActivity) {
        loadRuns(selectedActivity.id);
      }
      setError('');
    } catch (err) {
      setError('Failed to update run');
    }
  };

  const cancelEdit = () => {
    setEditingRunId(null);
    setEditDuration('');
    setEditMoney('');
  };

  const deleteRun = async (runId: number) => {
    if (!confirm('Delete this run?')) return;

    try {
      await axios.delete(`${API_BASE}/runs/${runId}`);
      if (selectedActivity) {
        loadRuns(selectedActivity.id);
      }
      setError('');
    } catch (err) {
      setError('Failed to delete run');
    }
  };

  const deleteActivityType = async (activityId: number) => {
    if (!confirm('Delete this activity and all its runs?')) return;

    try {
      await axios.delete(`${API_BASE}/activity-types/${activityId}`);
      setActivityTypes(activityTypes.filter(a => a.id !== activityId));
      if (selectedActivity?.id === activityId) {
        setSelectedActivity(null);
        setRuns([]);
      }
      setError('');
    } catch (err) {
      setError('Failed to delete activity');
    }
  };

  const calculateStats = (): RunStats => {
    if (runs.length === 0) {
      return {
        totalRuns: 0,
        avgDuration: 0,
        avgMoney: 0,
        avgMoneyPerHour: 0,
        totalMoney: 0,
        totalDuration: 0
      };
    }

    const totalDuration = runs.reduce((sum, run) => sum + run.duration, 0);
    const totalMoney = runs.reduce((sum, run) => sum + run.money, 0);
    const avgDuration = totalDuration / runs.length;
    const avgMoney = totalMoney / runs.length;
    const avgMoneyPerHour = avgDuration > 0 ? (avgMoney / avgDuration) * 60 : 0;

    return {
      totalRuns: runs.length,
      avgDuration,
      avgMoney,
      avgMoneyPerHour,
      totalMoney,
      totalDuration
    };
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const stats = calculateStats();

  if (loading) {
    return <div className="loading-state">Loading activities...</div>;
  }

  return (
    <div className="activities-panel">
      <div className="panel-header">
        <h2>Activities Tracker</h2>
        <p className="panel-description">
          Select an activity to track runs, or create a new one
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="activity-selector">
        <div className="activity-list">
          <h3>Activities</h3>
          <div className="activity-buttons">
            {activityTypes.map(activity => (
              <div key={activity.id} className="activity-item">
                <button
                  className={`activity-btn ${selectedActivity?.id === activity.id ? 'active' : ''}`}
                  onClick={() => setSelectedActivity(activity)}
                >
                  {activity.name}
                </button>
                <button
                  className="btn-delete-activity"
                  onClick={() => deleteActivityType(activity.id)}
                  title="Delete activity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {!showNewActivityForm ? (
            <button
              className="btn-primary btn-new-activity"
              onClick={() => setShowNewActivityForm(true)}
            >
              + New Activity
            </button>
          ) : (
            <div className="new-activity-form">
              <input
                type="text"
                className="activity-input"
                placeholder="Activity name"
                value={newActivityName}
                onChange={(e) => setNewActivityName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createActivityType()}
              />
              <button className="btn-save" onClick={createActivityType}>
                Create
              </button>
              <button className="btn-cancel" onClick={() => {
                setShowNewActivityForm(false);
                setNewActivityName('');
              }}>
                Cancel
              </button>
            </div>
          )}
        </div>

        {selectedActivity && (
          <div className="activity-details">
            <div className="activity-header">
              <h3>{selectedActivity.name}</h3>
            </div>

            <div className="add-run-form">
              <h4>Add New Run</h4>
              
              <div className="input-mode-toggle">
                <button
                  className={`mode-btn ${useChronometer ? 'active' : ''}`}
                  onClick={() => setUseChronometer(true)}
                >
                  ⏱️ Chronometer
                </button>
                <button
                  className={`mode-btn ${!useChronometer ? 'active' : ''}`}
                  onClick={() => setUseChronometer(false)}
                >
                  ⌨️ Manual Input
                </button>
              </div>

              {useChronometer ? (
                <div className="chronometer-section">
                  <div className="chronometer-display">
                    <div className="chronometer-time">{formatChronometer(elapsedTime)}</div>
                    <div className="chronometer-label">Activity Timer</div>
                  </div>
                  
                  <div className="chronometer-controls">
                    {!isTimerRunning && elapsedTime === 0 && (
                      <button className="btn-chrono btn-start" onClick={startChronometer}>
                        ▶ Start
                      </button>
                    )}
                    {isTimerRunning && (
                      <button className="btn-chrono btn-stop" onClick={stopChronometer}>
                        ⏸ Stop
                      </button>
                    )}
                    {!isTimerRunning && elapsedTime > 0 && (
                      <>
                        <button className="btn-chrono btn-reset" onClick={resetChronometer}>
                          ↻ Reset
                        </button>
                        <button className="btn-chrono btn-resume" onClick={() => {
                          setTimerStartTime(Date.now() - elapsedTime);
                          setIsTimerRunning(true);
                        }}>
                          ▶ Resume
                        </button>
                      </>
                    )}
                  </div>

                  {!isTimerRunning && elapsedTime > 0 && (
                    <div className="activity-form">
                      <input
                        type="number"
                        className="activity-input"
                        placeholder="Duration (auto-filled)"
                        value={runDuration}
                        onChange={(e) => setRunDuration(e.target.value)}
                        step="0.01"
                        min="0"
                        readOnly
                      />
                      <input
                        type="number"
                        className="activity-input activity-input-number"
                        placeholder="Money ($)"
                        value={runMoney}
                        onChange={(e) => setRunMoney(e.target.value)}
                        step="1000"
                        min="0"
                      />
                      <button className="btn-primary" onClick={addRun}>
                        Add Run
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="activity-form">
                  <input
                    type="number"
                    className="activity-input activity-input-number"
                    placeholder="Duration (min)"
                    value={runDuration}
                    onChange={(e) => setRunDuration(e.target.value)}
                    step="0.1"
                    min="0"
                  />
                  <input
                    type="number"
                    className="activity-input activity-input-number"
                    placeholder="Money ($)"
                    value={runMoney}
                    onChange={(e) => setRunMoney(e.target.value)}
                    step="1000"
                    min="0"
                  />
                  <button className="btn-primary" onClick={addRun}>
                    Add Run
                  </button>
                </div>
              )}
            </div>

            {runs.length > 0 && (
              <>
                <div className="stats-cards">
                  <div className="stat-card">
                    <div className="stat-label">Total Runs</div>
                    <div className="stat-value">{stats.totalRuns}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Avg Duration</div>
                    <div className="stat-value">{stats.avgDuration.toFixed(1)} min</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Avg Money</div>
                    <div className="stat-value">{formatMoney(stats.avgMoney)}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Avg $/Hour</div>
                    <div className="stat-value">{formatMoney(stats.avgMoneyPerHour)}</div>
                  </div>
                </div>

                <div className="runs-table">
                  <h4>Run History</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Duration (min)</th>
                        <th>Money</th>
                        <th>$/Hour</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.map(run => {
                        const moneyPerHour = run.duration > 0 ? (run.money / run.duration) * 60 : 0;
                        const isEditing = editingRunId === run.id;

                        return (
                          <tr key={run.id}>
                            <td className="date-cell">{formatDate(run.timestamp)}</td>
                            <td>
                              {isEditing ? (
                                <input
                                  type="number"
                                  className="edit-input edit-input-small"
                                  value={editDuration}
                                  onChange={(e) => setEditDuration(e.target.value)}
                                  step="0.1"
                                />
                              ) : (
                                run.duration.toFixed(1)
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <input
                                  type="number"
                                  className="edit-input"
                                  value={editMoney}
                                  onChange={(e) => setEditMoney(e.target.value)}
                                  step="1000"
                                />
                              ) : (
                                formatMoney(run.money)
                              )}
                            </td>
                            <td className="money-per-hour">
                              {formatMoney(moneyPerHour)}
                            </td>
                            <td>
                              <div className="actions-cell">
                                {isEditing ? (
                                  <>
                                    <button
                                      className="btn-save"
                                      onClick={() => saveEditRun(run.id)}
                                    >
                                      ✓
                                    </button>
                                    <button
                                      className="btn-cancel"
                                      onClick={cancelEdit}
                                    >
                                      ✕
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      className="btn-edit"
                                      onClick={() => startEditRun(run)}
                                    >
                                      ✎
                                    </button>
                                    <button
                                      className="btn-delete"
                                      onClick={() => deleteRun(run.id)}
                                    >
                                      🗑
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {runs.length === 0 && (
              <div className="empty-state">
                <p>No runs recorded yet. Add your first run above!</p>
              </div>
            )}
          </div>
        )}

        {!selectedActivity && activityTypes.length > 0 && (
          <div className="empty-state">
            <p>Select an activity from the list to view and track runs</p>
          </div>
        )}

        {!selectedActivity && activityTypes.length === 0 && (
          <div className="empty-state">
            <p>Create your first activity to start tracking!</p>
          </div>
        )}
      </div>
    </div>
  );
}
