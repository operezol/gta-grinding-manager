const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'activities.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Table for activity types
  db.run(`
    CREATE TABLE IF NOT EXISTS activity_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Table for individual runs of activities
  db.run(`
    CREATE TABLE IF NOT EXISTS activity_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_type_id INTEGER NOT NULL,
      duration REAL NOT NULL,
      money REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (activity_type_id) REFERENCES activity_types(id) ON DELETE CASCADE
    )
  `);
});

// Get all activity types
app.get('/api/activity-types', (req, res) => {
  db.all('SELECT * FROM activity_types ORDER BY name ASC', [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get runs for a specific activity type
app.get('/api/activity-types/:id/runs', (req, res) => {
  const { id } = req.params;
  db.all(
    'SELECT * FROM activity_runs WHERE activity_type_id = ? ORDER BY timestamp DESC',
    [id],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Create a new activity type
app.post('/api/activity-types', (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Activity name is required' });
  }

  db.run(
    'INSERT INTO activity_types (name) VALUES (?)',
    [name],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Activity already exists' });
        }
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, name });
    }
  );
});

// Add a run to an activity type
app.post('/api/activity-types/:id/runs', (req, res) => {
  const { id } = req.params;
  const { duration, money } = req.body;
  
  if (duration == null || money == null) {
    return res.status(400).json({ error: 'Duration and money are required' });
  }

  db.run(
    'INSERT INTO activity_runs (activity_type_id, duration, money) VALUES (?, ?, ?)',
    [id, duration, money],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, activity_type_id: id, duration, money });
    }
  );
});

// Update an activity run
app.put('/api/runs/:id', (req, res) => {
  const { id } = req.params;
  const { duration, money } = req.body;

  if (duration == null || money == null) {
    return res.status(400).json({ error: 'Duration and money are required' });
  }

  db.run(
    'UPDATE activity_runs SET duration = ?, money = ? WHERE id = ?',
    [duration, money, id],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Run not found' });
      }
      res.json({ id, duration, money });
    }
  );
});

// Delete an activity type (and all its runs due to CASCADE)
app.delete('/api/activity-types/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM activity_types WHERE id = ?', [id], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Activity type not found' });
    }
    res.json({ message: 'Activity type and all runs deleted' });
  });
});

// Delete a specific run
app.delete('/api/runs/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM activity_runs WHERE id = ?', [id], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Run not found' });
    }
    res.json({ message: 'Run deleted' });
  });
});

// Get activity statistics (aggregated data with money per hour)
app.get('/api/activity-stats', (req, res) => {
  const query = `
    SELECT 
      at.id,
      at.name,
      COUNT(ar.id) as total_runs,
      COALESCE(AVG(ar.duration), 0) as avg_duration,
      COALESCE(AVG(ar.money), 0) as avg_money,
      COALESCE(SUM(ar.money), 0) as total_money,
      COALESCE(SUM(ar.duration), 0) as total_duration,
      CASE 
        WHEN AVG(ar.duration) > 0 THEN (AVG(ar.money) / AVG(ar.duration)) * 60
        ELSE 0
      END as money_per_hour
    FROM activity_types at
    LEFT JOIN activity_runs ar ON at.id = ar.activity_type_id
    GROUP BY at.id, at.name
    ORDER BY money_per_hour DESC, at.name ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API Endpoints:`);
  console.log(`  GET    /api/activity-types`);
  console.log(`  POST   /api/activity-types`);
  console.log(`  DELETE /api/activity-types/:id`);
  console.log(`  GET    /api/activity-types/:id/runs`);
  console.log(`  POST   /api/activity-types/:id/runs`);
  console.log(`  PUT    /api/runs/:id`);
  console.log(`  DELETE /api/runs/:id`);
  console.log(`  GET    /api/activity-stats`);
});

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});
