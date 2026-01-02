import { useState, useEffect } from 'react';
import './App.css';
import CountdownPanel from './components/CountdownPanel';
import ActivitiesPanel from './components/ActivitiesPanel';
import StatsPanel from './components/StatsPanel';

function App() {
  const [activePanel, setActivePanel] = useState<'countdown' | 'activities' | 'stats'>('countdown');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div>
            <h1>Dashboard Manager</h1>
            <div className="header-subtitle">by Oriol Pérez Olivares</div>
          </div>
          <button 
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <nav className="nav-tabs">
        <button
          className={`nav-tab ${activePanel === 'countdown' ? 'active' : ''}`}
          onClick={() => setActivePanel('countdown')}
        >
          ⏱️ Countdown Timer
        </button>
        <button
          className={`nav-tab ${activePanel === 'activities' ? 'active' : ''}`}
          onClick={() => setActivePanel('activities')}
        >
          📊 Activities Tracker
        </button>
        <button
          className={`nav-tab ${activePanel === 'stats' ? 'active' : ''}`}
          onClick={() => setActivePanel('stats')}
        >
          🏆 Rankings
        </button>
      </nav>

      <main className="main-content">
        <div className={`panel-container ${activePanel === 'countdown' ? 'active' : 'hidden'}`}>
          <CountdownPanel />
        </div>
        <div className={`panel-container ${activePanel === 'activities' ? 'active' : 'hidden'}`}>
          <ActivitiesPanel />
        </div>
        <div className={`panel-container ${activePanel === 'stats' ? 'active' : 'hidden'}`}>
          <StatsPanel />
        </div>
      </main>
    </div>
  );
}

export default App;
