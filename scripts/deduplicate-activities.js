const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'gta_tracker.db');

async function deduplicateActivities() {
  const db = new sqlite3.Database(DB_PATH);

  const runAsync = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes || 0 });
      });
    });

  const allAsync = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
    });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 DEDUPLICATING ACTIVITIES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get all activities grouped by normalized name
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
      passive
    FROM activities 
    ORDER BY name
  `);

  // Group by normalized name
  const nameGroups = {};
  activities.forEach(activity => {
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

  const duplicates = Object.entries(nameGroups).filter(([_, group]) => group.length > 1);

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found. Database is clean.\n');
    db.close();
    return;
  }

  console.log(`Found ${duplicates.length} duplicate groups\n`);

  const stats = {
    merged: [],
    deleted: [],
    errors: []
  };

  // Process each duplicate group
  for (const [normalizedName, group] of duplicates) {
    try {
      // Strategy: Keep the best version
      // Priority:
      // 1. Dataset source with data
      // 2. Dataset source without data
      // 3. Legacy with sessions/stats
      // 4. Legacy without sessions

      // Check sessions for each
      const withSessions = [];
      for (const activity of group) {
        const sessions = await allAsync('SELECT COUNT(*) as count FROM sessions WHERE activity_id = ?', [activity.id]);
        const sessionCount = sessions[0].count;
        withSessions.push({ ...activity, sessionCount });
      }

      // Sort by priority
      const sorted = withSessions.sort((a, b) => {
        // Dataset with data wins
        if (a.source === 'dataset' && a.avg_payout != null && a.avg_time_minutes != null) return -1;
        if (b.source === 'dataset' && b.avg_payout != null && b.avg_time_minutes != null) return 1;
        
        // Dataset without data
        if (a.source === 'dataset' && !a.deprecated) return -1;
        if (b.source === 'dataset' && !b.deprecated) return 1;
        
        // Legacy with sessions
        if (a.sessionCount > 0 && b.sessionCount === 0) return -1;
        if (b.sessionCount > 0 && a.sessionCount === 0) return 1;
        
        // Legacy with data
        if (a.avg_payout != null && b.avg_payout == null) return -1;
        if (b.avg_payout != null && a.avg_payout == null) return 1;
        
        return 0;
      });

      const keepActivity = sorted[0];
      const deleteActivities = sorted.slice(1);

      console.log(`\n📋 "${keepActivity.name}"`);
      console.log(`   KEEP: ${keepActivity.id} (${keepActivity.source}, sessions: ${keepActivity.sessionCount})`);

      // Merge sessions and stats from duplicates to the kept activity
      for (const delActivity of deleteActivities) {
        console.log(`   DELETE: ${delActivity.id} (${delActivity.source}, sessions: ${delActivity.sessionCount})`);

        // Migrate sessions
        if (delActivity.sessionCount > 0) {
          await runAsync('UPDATE sessions SET activity_id = ? WHERE activity_id = ?', [keepActivity.id, delActivity.id]);
          console.log(`     → Migrated ${delActivity.sessionCount} sessions`);
        }

        // Migrate stats (merge into existing)
        const oldStats = await allAsync('SELECT * FROM stats WHERE activity_id = ?', [delActivity.id]);
        if (oldStats.length > 0) {
          const keepStats = await allAsync('SELECT * FROM stats WHERE activity_id = ?', [keepActivity.id]);
          
          if (keepStats.length > 0) {
            // Merge stats
            const totalMoney = (keepStats[0].total_money || 0) + (oldStats[0].total_money || 0);
            const totalTime = (keepStats[0].total_time || 0) + (oldStats[0].total_time || 0);
            const sessionCount = (keepStats[0].session_count || 0) + (oldStats[0].session_count || 0);
            const avgDpm = sessionCount > 0 ? Math.round(totalMoney / totalTime) : 0;

            await runAsync(`
              UPDATE stats 
              SET total_money = ?, total_time = ?, session_count = ?, avg_dpm = ?
              WHERE activity_id = ?
            `, [totalMoney, totalTime, sessionCount, avgDpm, keepActivity.id]);
            
            console.log(`     → Merged stats`);
          } else {
            // Just update activity_id
            await runAsync('UPDATE stats SET activity_id = ? WHERE activity_id = ?', [keepActivity.id, delActivity.id]);
            console.log(`     → Migrated stats`);
          }
        }

        // Migrate cooldowns
        await runAsync('UPDATE cooldowns SET activity_id = ? WHERE activity_id = ?', [keepActivity.id, delActivity.id]);
        
        // Migrate resupply
        await runAsync('UPDATE resupply SET activity_id = ? WHERE activity_id = ?', [keepActivity.id, delActivity.id]);
        
        // Migrate production_state
        await runAsync('UPDATE production_state SET activity_id = ? WHERE activity_id = ?', [keepActivity.id, delActivity.id]);
        
        // Migrate sell_sessions
        await runAsync('UPDATE sell_sessions SET activity_id = ? WHERE activity_id = ?', [keepActivity.id, delActivity.id]);
        
        // Migrate safe_collections
        await runAsync('UPDATE safe_collections SET activity_id = ? WHERE activity_id = ?', [keepActivity.id, delActivity.id]);

        // Delete the duplicate activity
        await runAsync('DELETE FROM activities WHERE id = ?', [delActivity.id]);
        
        stats.deleted.push(delActivity.id);
      }

      stats.merged.push(keepActivity.id);
    } catch (err) {
      console.error(`   ❌ Error processing "${group[0].name}":`, err.message);
      stats.errors.push({ name: group[0].name, error: err.message });
    }
  }

  // Report
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 DEDUPLICATION REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`Duplicate groups processed: ${duplicates.length}`);
  console.log(`Activities kept: ${stats.merged.length}`);
  console.log(`Activities deleted: ${stats.deleted.length}`);
  console.log(`Errors: ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log('\n❌ Errors:');
    stats.errors.forEach(e => console.log(`   - ${e.name}: ${e.error}`));
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ DEDUPLICATION COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  db.close();
}

deduplicateActivities().catch(err => {
  console.error('Deduplication failed:', err);
  process.exitCode = 1;
});
