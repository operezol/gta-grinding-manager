const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'gta_tracker.db');

async function analyzeDuplicates() {
  const db = new sqlite3.Database(DB_PATH);

  const allAsync = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
    });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 ANALYZING DUPLICATE ACTIVITIES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get all activities
  const activities = await allAsync(`
    SELECT 
      id, 
      name, 
      category, 
      source, 
      deprecated,
      avg_payout,
      avg_time_minutes,
      efficiency,
      solo,
      passive,
      (SELECT COUNT(*) FROM sessions WHERE activity_id = activities.id) as session_count,
      (SELECT SUM(money_earned) FROM sessions WHERE activity_id = activities.id) as total_earned
    FROM activities 
    ORDER BY name, source
  `);

  console.log(`Total activities: ${activities.length}\n`);

  // Group by normalized name
  const nameGroups = {};
  activities.forEach(activity => {
    // Normalize name for comparison
    const normalized = activity.name
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[–—-]/g, '-')
      .trim();
    
    if (!nameGroups[normalized]) {
      nameGroups[normalized] = [];
    }
    nameGroups[normalized].push(activity);
  });

  // Find duplicates
  const duplicates = Object.entries(nameGroups).filter(([_, group]) => group.length > 1);
  
  console.log(`Activities with duplicates: ${duplicates.length}\n`);

  if (duplicates.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('DUPLICATES FOUND:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    duplicates.forEach(([normalizedName, group]) => {
      console.log(`\n📋 "${group[0].name}" (${group.length} entries):`);
      group.forEach(activity => {
        const hasData = activity.avg_payout != null && activity.avg_time_minutes != null;
        const hasSessions = activity.session_count > 0;
        
        console.log(`  - ID: ${activity.id}`);
        console.log(`    Source: ${activity.source || 'NULL'}`);
        console.log(`    Deprecated: ${activity.deprecated ? 'YES' : 'NO'}`);
        console.log(`    Has metrics: ${hasData ? 'YES' : 'NO'}`);
        console.log(`    Sessions: ${activity.session_count}`);
        console.log(`    Total earned: $${(activity.total_earned || 0).toLocaleString()}`);
        console.log(`    Solo: ${activity.solo != null ? (activity.solo ? 'YES' : 'NO') : 'NULL'}`);
        console.log(`    Passive: ${activity.passive != null ? (activity.passive ? 'YES' : 'NO') : 'NULL'}`);
        console.log('');
      });
    });
  }

  // Analyze dataset vs legacy
  const datasetActivities = activities.filter(a => a.source === 'dataset');
  const legacyActivities = activities.filter(a => a.source === 'legacy' || !a.source);
  const withData = activities.filter(a => a.avg_payout != null && a.avg_time_minutes != null);
  const withSessions = activities.filter(a => a.session_count > 0);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`Total activities: ${activities.length}`);
  console.log(`  - Dataset source: ${datasetActivities.length}`);
  console.log(`  - Legacy source: ${legacyActivities.length}`);
  console.log(`  - With metrics: ${withData.length}`);
  console.log(`  - With sessions: ${withSessions.length}`);
  console.log(`  - Duplicate groups: ${duplicates.length}`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('RECOMMENDATION:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (duplicates.length > 0) {
    console.log('⚠️  Duplicates found. Run deduplication script to merge them.');
    console.log('   Strategy: Keep dataset version, merge sessions/stats from legacy.\n');
  } else {
    console.log('✅ No duplicates found. Database is clean.\n');
  }

  db.close();
}

analyzeDuplicates().catch(err => {
  console.error('Analysis failed:', err);
  process.exitCode = 1;
});
