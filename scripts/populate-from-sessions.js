const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '..', 'gta_tracker.db');
const DATASET_PATH = path.join(__dirname, '..', 'data.json');

async function populateFromSessions() {
  const db = new sqlite3.Database(DB_PATH);

  const allAsync = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
    });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 POPULATING DATA FROM SESSIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get activities with sessions but no metrics
  const activities = await allAsync(`
    SELECT 
      a.id,
      a.name,
      a.category,
      a.avg_payout,
      a.avg_time_minutes,
      s.total_money,
      s.total_time,
      s.session_count
    FROM activities a
    LEFT JOIN stats s ON a.id = s.activity_id
    WHERE s.session_count > 0 
      AND (a.avg_payout IS NULL OR a.avg_time_minutes IS NULL)
      AND a.deprecated = 0
  `);

  if (activities.length === 0) {
    console.log('✅ No activities with sessions and missing data.\n');
    db.close();
    return;
  }

  console.log(`Found ${activities.length} activities with sessions but no metrics:\n`);

  // Load current dataset
  let dataset = [];
  try {
    const rawData = fs.readFileSync(DATASET_PATH, 'utf8');
    dataset = JSON.parse(rawData);
  } catch (err) {
    console.error('❌ Could not read data.json:', err.message);
    db.close();
    return;
  }

  const updates = [];

  activities.forEach(activity => {
    const avgPayout = Math.round(activity.total_money / activity.session_count);
    const avgTime = Math.round((activity.total_time / activity.session_count) * 10) / 10; // Round to 1 decimal

    console.log(`${activity.name}:`);
    console.log(`  Sessions: ${activity.session_count}`);
    console.log(`  Avg Payout: $${avgPayout.toLocaleString()}`);
    console.log(`  Avg Time: ${avgTime} minutes`);
    console.log(`  Efficiency: $${Math.round(avgPayout / avgTime).toLocaleString()}/min\n`);

    // Update or add to dataset
    const existing = dataset.find(d => d.id === activity.id);
    if (existing) {
      // Update existing entry
      if (!existing.payout) existing.payout = avgPayout;
      if (!existing.time_minutes) existing.time_minutes = avgTime;
      updates.push({ id: activity.id, action: 'updated' });
    } else {
      // Add new entry (shouldn't happen but handle it)
      dataset.push({
        id: activity.id,
        name: activity.name,
        category: activity.category,
        solo: null, // Unknown from sessions
        passive: null,
        payout: avgPayout,
        time_minutes: avgTime,
        cooldown_minutes: null
      });
      updates.push({ id: activity.id, action: 'added' });
    }
  });

  // Write updated dataset
  try {
    fs.writeFileSync(DATASET_PATH, JSON.stringify(dataset, null, 2), 'utf8');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ data.json UPDATED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Updated: ${updates.filter(u => u.action === 'updated').length}`);
    console.log(`Added: ${updates.filter(u => u.action === 'added').length}\n`);
    console.log('Next step: Re-import to database');
    console.log('  node scripts/import-dataset.js\n');
  } catch (err) {
    console.error('❌ Could not write data.json:', err.message);
  }

  db.close();
}

populateFromSessions().catch(err => {
  console.error('Failed:', err);
  process.exitCode = 1;
});
