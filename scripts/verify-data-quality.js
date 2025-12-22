const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'gta_tracker.db');

async function verifyDataQuality() {
  const db = new sqlite3.Database(DB_PATH);

  const allAsync = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
    });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ DATA QUALITY VERIFICATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const issues = [];

  // Check 1: Required fields
  const missingFields = await allAsync(`
    SELECT id, name FROM activities 
    WHERE id IS NULL OR name IS NULL OR category IS NULL
  `);
  if (missingFields.length > 0) {
    issues.push({
      severity: 'ERROR',
      message: `${missingFields.length} activities missing required fields (id, name, or category)`
    });
  } else {
    console.log('✅ All activities have required fields (id, name, category)');
  }

  // Check 2: Duplicates
  const duplicates = await allAsync(`
    SELECT name, COUNT(*) as count 
    FROM activities 
    GROUP BY LOWER(REPLACE(REPLACE(name, '–', '-'), ' ', ''))
    HAVING count > 1
  `);
  if (duplicates.length > 0) {
    issues.push({
      severity: 'WARNING',
      message: `${duplicates.length} potential duplicate groups found`,
      details: duplicates.map(d => `"${d.name}" (${d.count} entries)`)
    });
  } else {
    console.log('✅ No duplicates found');
  }

  // Check 3: Activities with sessions but no metrics
  const withSessionsNoMetrics = await allAsync(`
    SELECT a.id, a.name, s.session_count
    FROM activities a
    JOIN stats s ON a.id = s.activity_id
    WHERE s.session_count > 0
      AND (a.avg_payout IS NULL OR a.avg_time_minutes IS NULL)
      AND a.deprecated = 0
  `);
  if (withSessionsNoMetrics.length > 0) {
    issues.push({
      severity: 'INFO',
      message: `${withSessionsNoMetrics.length} activities have sessions but no metrics`,
      details: withSessionsNoMetrics.slice(0, 5).map(a => `${a.name} (${a.session_count} sessions)`)
    });
  } else {
    console.log('✅ All activities with sessions have metrics');
  }

  // Check 4: Invalid efficiency
  const invalidEfficiency = await allAsync(`
    SELECT id, name, avg_payout, avg_time_minutes, efficiency
    FROM activities
    WHERE avg_payout IS NOT NULL 
      AND avg_time_minutes IS NOT NULL
      AND avg_time_minutes > 0
      AND (efficiency IS NULL OR ABS(efficiency - (avg_payout / avg_time_minutes)) > 10)
  `);
  if (invalidEfficiency.length > 0) {
    issues.push({
      severity: 'WARNING',
      message: `${invalidEfficiency.length} activities have incorrect efficiency calculation`
    });
  } else {
    console.log('✅ All efficiencies correctly calculated');
  }

  // Check 5: Source marking
  const noSource = await allAsync(`
    SELECT id, name FROM activities WHERE source IS NULL AND deprecated = 0
  `);
  if (noSource.length > 0) {
    issues.push({
      severity: 'INFO',
      message: `${noSource.length} activities missing source field`
    });
  } else {
    console.log('✅ All active activities have source marked');
  }

  // Check 6: Deprecated count
  const deprecated = await allAsync(`SELECT COUNT(*) as count FROM activities WHERE deprecated = 1`);
  const active = await allAsync(`SELECT COUNT(*) as count FROM activities WHERE deprecated = 0`);
  console.log(`✅ ${active[0].count} active activities, ${deprecated[0].count} deprecated`);

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const errors = issues.filter(i => i.severity === 'ERROR');
  const warnings = issues.filter(i => i.severity === 'WARNING');
  const info = issues.filter(i => i.severity === 'INFO');

  if (errors.length > 0) {
    console.log(`❌ ERRORS (${errors.length}):`);
    errors.forEach(e => {
      console.log(`   - ${e.message}`);
      if (e.details) e.details.forEach(d => console.log(`     ${d}`));
    });
    console.log('');
  }

  if (warnings.length > 0) {
    console.log(`⚠️  WARNINGS (${warnings.length}):`);
    warnings.forEach(w => {
      console.log(`   - ${w.message}`);
      if (w.details) w.details.forEach(d => console.log(`     ${d}`));
    });
    console.log('');
  }

  if (info.length > 0) {
    console.log(`ℹ️  INFO (${info.length}):`);
    info.forEach(i => {
      console.log(`   - ${i.message}`);
      if (i.details) {
        i.details.forEach(d => console.log(`     ${d}`));
        if (i.details.length < withSessionsNoMetrics.length) {
          console.log(`     ... and ${withSessionsNoMetrics.length - i.details.length} more`);
        }
      }
    });
    console.log('');
  }

  if (issues.length === 0) {
    console.log('✅ DATA QUALITY: EXCELLENT\n');
    console.log('No issues found. Database is in good shape!\n');
  } else if (errors.length === 0) {
    console.log('✅ DATA QUALITY: GOOD\n');
    console.log('No critical errors. Some improvements possible.\n');
  } else {
    console.log('❌ DATA QUALITY: NEEDS ATTENTION\n');
    console.log('Critical errors found. Please fix before proceeding.\n');
  }

  db.close();
}

verifyDataQuality().catch(err => {
  console.error('Verification failed:', err);
  process.exitCode = 1;
});
