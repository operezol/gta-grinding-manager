const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'gta_tracker.db');

async function migrate() {
  const db = new sqlite3.Database(DB_PATH);

  const runAsync = (sql) =>
    new Promise((resolve, reject) => {
      db.run(sql, function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes || 0 });
      });
    });

  const allAsync = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
    });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 DATABASE MIGRATION FOR UNIVERSAL DATASET SUPPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Database: ${DB_PATH}\n`);

  // Get current schema
  const columns = await allAsync('PRAGMA table_info(activities)');
  const columnNames = new Set(columns.map(c => c.name));

  console.log('Current columns:', columnNames.size);

  const migrations = [];

  // Add deprecated column (track activities not in current dataset)
  if (!columnNames.has('deprecated')) {
    migrations.push({
      name: 'Add deprecated column',
      sql: 'ALTER TABLE activities ADD COLUMN deprecated BOOLEAN DEFAULT FALSE'
    });
  }

  // Add source column (track where activity came from: dataset, wiki, manual, legacy)
  if (!columnNames.has('source')) {
    migrations.push({
      name: 'Add source column',
      sql: 'ALTER TABLE activities ADD COLUMN source TEXT DEFAULT \'legacy\''
    });
  }

  // Add production_minutes column (time to produce full stock)
  if (!columnNames.has('production_minutes')) {
    migrations.push({
      name: 'Add production_minutes column',
      sql: 'ALTER TABLE activities ADD COLUMN production_minutes INTEGER'
    });
  }

  // Add supply_consumption_minutes column (time supplies last)
  if (!columnNames.has('supply_consumption_minutes')) {
    migrations.push({
      name: 'Add supply_consumption_minutes column',
      sql: 'ALTER TABLE activities ADD COLUMN supply_consumption_minutes INTEGER'
    });
  }

  // Add max_storage column (align with dataset field name)
  if (!columnNames.has('max_storage')) {
    migrations.push({
      name: 'Add max_storage column',
      sql: 'ALTER TABLE activities ADD COLUMN max_storage REAL'
    });
  }

  if (migrations.length === 0) {
    console.log('✅ Database schema is up to date. No migrations needed.\n');
    db.close();
    return;
  }

  console.log(`Running ${migrations.length} migration(s)...\n`);

  for (const migration of migrations) {
    try {
      await runAsync(migration.sql);
      console.log(`✅ ${migration.name}`);
    } catch (err) {
      console.error(`❌ ${migration.name}: ${err.message}`);
      throw err;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ MIGRATION COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Next step: Run the dataset import script');
  console.log('  node scripts/import-dataset.js\n');

  db.close();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exitCode = 1;
});
