const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const ROOT = path.join(__dirname, '..');
const DB_PATH = path.join(ROOT, 'gta_tracker.db');
const DATASET_PATH = path.join(ROOT, 'data.json');

async function importDataset() {
  // Read dataset
  const rawData = fs.readFileSync(DATASET_PATH, 'utf8');
  const dataset = JSON.parse(rawData);

  if (!Array.isArray(dataset)) {
    throw new Error('Dataset must be an array of activities');
  }

  const db = new sqlite3.Database(DB_PATH);

  const runAsync = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes || 0, lastID: this.lastID });
      });
    });

  const allAsync = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
    });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 IMPORTING DATASET TO DATABASE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Dataset: ${DATASET_PATH}`);
  console.log(`Database: ${DB_PATH}`);
  console.log(`Activities in dataset: ${dataset.length}\n`);

  // Get all existing activities
  const existingActivities = await allAsync('SELECT id FROM activities');
  const existingIds = new Set(existingActivities.map(a => a.id));
  const datasetIds = new Set(dataset.map(a => a.id).filter(Boolean));

  console.log(`Existing activities in DB: ${existingIds.size}`);
  console.log(`Valid activities in dataset: ${datasetIds.size}\n`);

  const stats = {
    created: [],
    updated: [],
    skipped: [],
    deprecated: [],
    errors: []
  };

  // Process each activity in dataset
  for (const activity of dataset) {
    const id = activity.id;
    const name = activity.name;
    const category = activity.category;

    // Validate required fields
    if (!id || !name || !category) {
      stats.skipped.push({ id, name, reason: 'Missing required field (id, name, or category)' });
      continue;
    }

    try {
      const exists = existingIds.has(id);

      // Build field mapping (dataset -> DB columns)
      const fields = {
        id,
        name,
        category,
        solo: activity.solo ?? null,
        passive: activity.passive ?? null,
        deprecated: false, // Activities in dataset are not deprecated
        source: 'dataset',
        avg_payout: activity.payout ?? null,
        avg_time_minutes: activity.time_minutes ?? null,
        cooldown_minutes: activity.cooldown_minutes ?? null,
        production_minutes: activity.production_minutes ?? null,
        supply_consumption_minutes: activity.supply_consumption_minutes ?? null,
        max_storage: activity.max_storage ?? null,
        // Legacy/compatibility fields (keep if present in dataset, otherwise don't overwrite)
        variant: activity.variant ?? null,
        release_year: activity.release ?? null,
        boostable: activity.boostable ?? null,
        modifiers: activity.modifiers ? JSON.stringify(activity.modifiers) : null,
        payout_type: activity.payout_type ?? null,
        resupply_minutes: activity.resupply_minutes ?? null,
        max_stock: activity.max_stock ?? null,
        stock_value: activity.stock_value ?? null,
        players_min: activity.players_min ?? null,
        players_max: activity.players_max ?? null,
        requires: activity.requires ? JSON.stringify(activity.requires) : null,
        cooldowns: activity.cooldowns ? JSON.stringify(activity.cooldowns) : null,
        tags: activity.tags ? JSON.stringify(activity.tags) : null,
        source_url: activity.source_url ?? null,
        update_name: activity.update ?? null
      };

      // Calculate efficiency if payout and time are available
      if (fields.avg_payout && fields.avg_time_minutes && fields.avg_time_minutes > 0) {
        fields.efficiency = Math.round(fields.avg_payout / fields.avg_time_minutes);
      }

      if (exists) {
        // UPDATE: Only update fields that are present (non-null) in dataset
        const updateFields = [];
        const updateValues = [];

        for (const [key, value] of Object.entries(fields)) {
          if (key === 'id') continue; // Don't update ID
          // Only update if value is explicitly set in dataset (not null from fallback)
          if (activity.hasOwnProperty(key) || ['deprecated', 'source', 'name', 'category', 'solo', 'passive'].includes(key)) {
            updateFields.push(`${key} = ?`);
            updateValues.push(value);
          }
        }

        if (updateFields.length > 0) {
          updateValues.push(id);
          const sql = `UPDATE activities SET ${updateFields.join(', ')} WHERE id = ?`;
          await runAsync(sql, updateValues);
          stats.updated.push({ id, name });
        } else {
          stats.skipped.push({ id, name, reason: 'No fields to update' });
        }
      } else {
        // INSERT: Create new activity
        const columns = Object.keys(fields);
        const placeholders = columns.map(() => '?').join(', ');
        const values = Object.values(fields);

        const sql = `INSERT INTO activities (${columns.join(', ')}) VALUES (${placeholders})`;
        await runAsync(sql, values);
        stats.created.push({ id, name });
      }
    } catch (err) {
      stats.errors.push({ id, name, error: err.message });
    }
  }

  // Mark deprecated activities (exist in DB but not in dataset)
  const deprecatedIds = [...existingIds].filter(id => !datasetIds.has(id));
  if (deprecatedIds.length > 0) {
    for (const id of deprecatedIds) {
      try {
        await runAsync('UPDATE activities SET deprecated = TRUE WHERE id = ?', [id]);
        const activity = await allAsync('SELECT name FROM activities WHERE id = ?', [id]);
        stats.deprecated.push({ id, name: activity[0]?.name });
      } catch (err) {
        stats.errors.push({ id, error: err.message });
      }
    }
  }

  // Print report
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 IMPORT REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`✅ Created: ${stats.created.length}`);
  if (stats.created.length > 0 && stats.created.length <= 10) {
    stats.created.forEach(a => console.log(`   - ${a.name} (${a.id})`));
  } else if (stats.created.length > 10) {
    stats.created.slice(0, 10).forEach(a => console.log(`   - ${a.name} (${a.id})`));
    console.log(`   ... and ${stats.created.length - 10} more`);
  }

  console.log(`\n🔄 Updated: ${stats.updated.length}`);
  if (stats.updated.length > 0 && stats.updated.length <= 10) {
    stats.updated.forEach(a => console.log(`   - ${a.name} (${a.id})`));
  } else if (stats.updated.length > 10) {
    stats.updated.slice(0, 10).forEach(a => console.log(`   - ${a.name} (${a.id})`));
    console.log(`   ... and ${stats.updated.length - 10} more`);
  }

  console.log(`\n⚠️  Deprecated: ${stats.deprecated.length}`);
  if (stats.deprecated.length > 0 && stats.deprecated.length <= 10) {
    stats.deprecated.forEach(a => console.log(`   - ${a.name} (${a.id})`));
  } else if (stats.deprecated.length > 10) {
    stats.deprecated.slice(0, 10).forEach(a => console.log(`   - ${a.name} (${a.id})`));
    console.log(`   ... and ${stats.deprecated.length - 10} more`);
  }

  console.log(`\n⏭️  Skipped: ${stats.skipped.length}`);
  if (stats.skipped.length > 0 && stats.skipped.length <= 5) {
    stats.skipped.forEach(a => console.log(`   - ${a.name || a.id}: ${a.reason}`));
  } else if (stats.skipped.length > 5) {
    stats.skipped.slice(0, 5).forEach(a => console.log(`   - ${a.name || a.id}: ${a.reason}`));
    console.log(`   ... and ${stats.skipped.length - 5} more`);
  }

  console.log(`\n❌ Errors: ${stats.errors.length}`);
  if (stats.errors.length > 0) {
    stats.errors.forEach(a => console.log(`   - ${a.name || a.id}: ${a.error}`));
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ IMPORT COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  db.close();
}

importDataset().catch((err) => {
  console.error('Import failed:', err);
  process.exitCode = 1;
});
