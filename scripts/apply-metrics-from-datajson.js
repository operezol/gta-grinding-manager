const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const ROOT = path.join(__dirname, '..');
const DB_PATH = path.join(ROOT, 'gta_tracker.db');
const DATA_PATH = path.join(ROOT, 'data.json');

const normalize = (s) => String(s || '').trim().toLowerCase();

const toAvgNumber = (value) => {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'object') {
    const min = typeof value.min === 'number' ? value.min : null;
    const max = typeof value.max === 'number' ? value.max : null;
    if (min == null && max == null) return null;
    if (min != null && max != null) return (min + max) / 2;
    return min != null ? min : max;
  }
  return null;
};

const roundInt = (n) => {
  if (n == null) return null;
  const x = Number(n);
  if (Number.isNaN(x)) return null;
  return Math.round(x);
};

const roundTimeMinutes = (n) => {
  if (n == null) return null;
  const x = Number(n);
  if (Number.isNaN(x)) return null;
  // DB stores avg_time_minutes as INTEGER; keep it stable
  return Math.max(1, Math.round(x));
};

async function run() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  const json = JSON.parse(raw);
  const activities = Array.isArray(json.activities) ? json.activities : [];

  if (activities.length === 0) {
    console.log('No activities found in data.json');
    return;
  }

  const db = new sqlite3.Database(DB_PATH);

  const allAsync = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
    });

  const runAsync = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes || 0 });
      });
    });

  const updated = [];
  const missing = [];
  const ambiguous = [];
  const skippedInvalid = [];

  // Index existing activities by normalized name for fast matching
  const existing = await allAsync('SELECT id, name FROM activities');
  const nameToIds = new Map();
  for (const row of existing) {
    const key = normalize(row.name);
    if (!key) continue;
    const arr = nameToIds.get(key) || [];
    arr.push({ id: row.id, name: row.name });
    nameToIds.set(key, arr);
  }

  for (const a of activities) {
    const name = String(a?.name || '').trim();
    const key = normalize(name);
    if (!key) {
      skippedInvalid.push({ reason: 'missing name', activity: a });
      continue;
    }

    const matches = nameToIds.get(key) || [];
    if (matches.length === 0) {
      missing.push(name);
      continue;
    }
    if (matches.length > 1) {
      ambiguous.push({ name, matches });
      continue;
    }

    const id = matches[0].id;

    const payoutAvg = toAvgNumber(a.payout);
    const timeAvg = toAvgNumber(a.time_minutes);

    // If payout is 0 (e.g. preps), keep it as 0 but still update time.
    const avgPayout = roundInt(payoutAvg);
    const avgTimeMinutes = roundTimeMinutes(timeAvg);

    if (avgPayout == null || avgTimeMinutes == null) {
      skippedInvalid.push({ reason: 'missing payout/time', name, payout: a.payout, time_minutes: a.time_minutes });
      continue;
    }

    const efficiency = avgTimeMinutes > 0 ? Math.round(avgPayout / avgTimeMinutes) : 0;

    const category = typeof a.category === 'string' && a.category.trim() ? a.category.trim() : null;
    const solo = typeof a.solo === 'boolean' ? (a.solo ? 1 : 0) : null;

    // Passive flag: only force true for "passive" category; otherwise false
    const passive = category === 'passive' ? 1 : 0;

    const sql = `
      UPDATE activities
      SET
        avg_payout = ?,
        avg_time_minutes = ?,
        efficiency = ?,
        category = COALESCE(?, category),
        solo = COALESCE(?, solo),
        passive = ?
      WHERE id = ?
    `;

    const result = await runAsync(sql, [avgPayout, avgTimeMinutes, efficiency, category, solo, passive, id]);
    if (result.changes > 0) {
      updated.push({ id, name, avgPayout, avgTimeMinutes, efficiency, category: category ?? undefined });
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 APPLY METRICS FROM data.json');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`DB:   ${DB_PATH}`);
  console.log(`Data: ${DATA_PATH}`);
  console.log('');
  console.log(`✅ Updated: ${updated.length}`);
  console.log(`⚠️  Missing in DB: ${missing.length}`);
  console.log(`⚠️  Ambiguous matches: ${ambiguous.length}`);
  console.log(`⚠️  Skipped invalid rows: ${skippedInvalid.length}`);

  if (missing.length) {
    console.log('\nMissing (sample):');
    console.log(missing.slice(0, 25).map((n) => `- ${n}`).join('\n'));
    if (missing.length > 25) console.log(`... +${missing.length - 25} more`);
  }

  if (ambiguous.length) {
    console.log('\nAmbiguous (sample):');
    for (const item of ambiguous.slice(0, 10)) {
      console.log(`- ${item.name}: ${item.matches.map((m) => m.id).join(', ')}`);
    }
    if (ambiguous.length > 10) console.log(`... +${ambiguous.length - 10} more`);
  }

  console.log('\nUpdated (sample):');
  for (const u of updated.slice(0, 10)) {
    console.log(`- ${u.name}: $${u.avgPayout} / ${u.avgTimeMinutes}m => ${u.efficiency} $/min`);
  }
  if (updated.length > 10) console.log(`... +${updated.length - 10} more`);

  db.close();
}

run().catch((err) => {
  console.error('Failed to apply metrics:', err);
  process.exitCode = 1;
});
