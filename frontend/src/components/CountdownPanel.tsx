import { useState, useEffect } from 'react';

interface Timer {
  id: string;
  name: string;
  endTime: number;
}

export default function CountdownPanel() {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [newTimerName, setNewTimerName] = useState('');
  const [newTimerMinutes, setNewTimerMinutes] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const expiredTimers = timers.filter(timer => 
      timer.endTime <= currentTime && timer.endTime > currentTime - 1000
    );
    
    expiredTimers.forEach(timer => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Timer Finished!', {
          body: `${timer.name} has completed`,
          icon: '/favicon.ico'
        });
      }
      
      const audio = new Audio();
      audio.play().catch(() => {});
    });
  }, [currentTime, timers]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const addTimer = () => {
    if (!newTimerName.trim() || !newTimerMinutes) return;

    const minutes = parseFloat(newTimerMinutes);
    if (isNaN(minutes) || minutes <= 0) return;

    const newTimer: Timer = {
      id: Date.now().toString(),
      name: newTimerName.trim(),
      endTime: Date.now() + minutes * 60 * 1000
    };

    setTimers(prev => [...prev, newTimer]);
    setNewTimerName('');
    setNewTimerMinutes('');
  };

  const removeTimer = (id: string) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="countdown-panel">
      <div className="panel-header">
        <h2>Countdown Timers</h2>
        <p className="panel-description">Create temporary countdown timers that notify you when complete</p>
      </div>

      <div className="timer-form">
        <input
          type="text"
          placeholder="Timer name"
          value={newTimerName}
          onChange={(e) => setNewTimerName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTimer()}
          className="timer-input"
        />
        <input
          type="number"
          placeholder="Minutes"
          value={newTimerMinutes}
          onChange={(e) => setNewTimerMinutes(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTimer()}
          className="timer-input timer-input-number"
          min="0.1"
          step="0.5"
        />
        <button onClick={addTimer} className="btn-primary">
          Add Timer
        </button>
      </div>

      <div className="timers-grid">
        {timers.length === 0 ? (
          <div className="empty-state">
            <p>No active timers. Create one to get started!</p>
          </div>
        ) : (
          timers.map(timer => {
            const remaining = Math.max(0, timer.endTime - currentTime);
            const isExpired = remaining === 0;

            return (
              <div key={timer.id} className={`timer-card ${isExpired ? 'expired' : ''}`}>
                <div className="timer-header">
                  <h3>{timer.name}</h3>
                  <button
                    onClick={() => removeTimer(timer.id)}
                    className="btn-remove"
                    title="Remove timer"
                  >
                    ×
                  </button>
                </div>
                <div className="timer-display">
                  {isExpired ? (
                    <span className="timer-finished">Finished!</span>
                  ) : (
                    <span className="timer-time">{formatTime(remaining)}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
