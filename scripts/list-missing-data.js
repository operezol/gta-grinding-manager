const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'gta_tracker.db');

async function listMissingData() {
  const db = new sqlite3.Database(DB_PATH);

  const allAsync = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
    });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ACTIVITIES MISSING DATA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const activities = await allAsync(`
    SELECT 
      id,
      name,
      category,
      source,
      deprecated,
      avg_payout,
      avg_time_minutes,
      solo,
      passive,
      (SELECT COUNT(*) FROM sessions WHERE activity_id = activities.id) as session_count
    FROM activities
    WHERE deprecated = 0
    ORDER BY category, name
  `);

  const missingPayout = activities.filter(a => a.avg_payout == null);
  const missingTime = activities.filter(a => a.avg_time_minutes == null);
  const missingBoth = activities.filter(a => a.avg_payout == null && a.avg_time_minutes == null);
  const withSessions = activities.filter(a => a.session_count > 0);
  const withSessionsButNoData = withSessions.filter(a => a.avg_payout == null || a.avg_time_minutes == null);

  console.log(`Total active activities: ${activities.length}`);
  console.log(`Missing payout: ${missingPayout.length}`);
  console.log(`Missing time: ${missingTime.length}`);
  console.log(`Missing both: ${missingBoth.length}`);
  console.log(`With sessions: ${withSessions.length}`);
  console.log(`With sessions but no data: ${withSessionsButNoData.length}\n`);

  // Group by category
  const byCategory = {};
  missingBoth.forEach(activity => {
    if (!byCategory[activity.category]) {
      byCategory[activity.category] = [];
    }
    byCategory[activity.category].push(activity);
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ACTIVITIES WITHOUT METRICS (by category):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  Object.entries(byCategory).forEach(([category, acts]) => {
    console.log(`\n${category.toUpperCase()} (${acts.length}):`);
    acts.forEach(a => {
      const flags = [];
      if (a.solo) flags.push('👤');
      if (a.passive) flags.push('⏸️');
      if (a.session_count > 0) flags.push(`📈${a.session_count}`);
      
      console.log(`  - ${a.name} ${flags.join(' ')}`);
      console.log(`    ID: ${a.id} | Source: ${a.source}`);
    });
  });

  if (withSessionsButNoData.length > 0) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚡ PRIORITY: Activities with sessions but no metrics:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('These can be populated from your real session data!\n');
    
    withSessionsButNoData.forEach(a => {
      console.log(`  - ${a.name} (${a.session_count} sessions)`);
      console.log(`    Run: node scripts/populate-from-sessions.js --activity "${a.id}"\n`);
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 NEXT STEPS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('1. Populate from sessions: node scripts/populate-from-sessions.js');
  console.log('2. Manually add verified data to data.json');
  console.log('3. Re-import: node scripts/import-dataset.js\n');

  db.close();
}

listMissingData().catch(err => {
  console.error('Failed:', err);
  process.exitCode = 1;
});
