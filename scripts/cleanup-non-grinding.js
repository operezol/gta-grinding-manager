const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'gta_tracker.db');

// Categories of non-grinding activities to remove
const NON_GRINDING_PATTERNS = [
  // Adversary Modes
  /adversary/i,
  /air quota/i,
  /assault on att/i,
  /beast vs/i,
  /bombushka run/i,
  /collection time/i,
  /come out to play/i,
  /condemned/i,
  /cross the line/i,
  /dawn raid/i,
  /deadline/i,
  /dogfight/i,
  /double down/i,
  /drop zone/i,
  /entourage/i,
  /every bullet counts/i,
  /extraction/i,
  /hasta la vista/i,
  /hunting pack/i,
  /inch by inch/i,
  /juggernaut/i,
  /lost vs damned/i,
  /occupy/i,
  /offense defense/i,
  /power mad/i,
  /power play/i,
  /relay/i,
  /resurrection/i,
  /rhino hunt/i,
  /running back/i,
  /siege mentality/i,
  /slasher/i,
  /slipstream/i,
  /stockpile/i,
  /sumo \(/i,
  /trap door/i,
  /turf wars/i,
  
  // Arena War
  /arena workshop/i,
  /bomb ball/i,
  /buzzer beater/i,
  /carnage/i,
  /cerberus/i,
  /flag war/i,
  /here come the monsters/i,
  /hot bomb/i,
  /tag team/i,
  /wreck it/i,
  /games masters/i,
  
  // Motor Wars
  /motor wars/i,
  
  // Individual Heist Preps (not the heist itself)
  /^heist prep:/i,
  /^setup:/i,
  
  // Entity/Location/NPC pages
  /^bank of liberty/i,
  /^bolingbroke penitentiary$/i,
  /^cargobob \(hd/i,
  /^el gordo lighthouse/i,
  /^fleeca job$/i, // Location, not heist
  /^great ocean highway/i,
  /^humane labs and research$/i,
  /^los santos police/i,
  /^martin madrazo$/i,
  /^martin madrazo's house/i,
  /^maxim rashkovsky/i,
  /^merryweather security$/i,
  /^military \(hd/i,
  /^mission row police/i,
  /^o'neil ranch$/i,
  /^pacific standard public deposit bank$/i,
  /^securicar \(hd/i,
  /^series a$/i, // Not the heist "Series A Funding"
  /^state of san andreas/i,
  /^union depository$/i, // Location
  /^vangelico$/i, // Store name, not robbery
  /^tommy vercetti/i,
  /^vincent \(character\)/i,
  
  // GTA Story Mission references
  /^blitz play$/i,
  /^marriage counseling$/i,
  /^monkey business$/i,
  
  // Locations
  /^24\/7 \(hd/i,
  /^arcade$/i,
  /^grove street \(hd/i,
  /^jetsam terminal/i,
  /^ltd gasoline/i,
  /^los santos customs$/i,
  /^los santos international airport/i,
  /^ron alternates/i,
  /^tequi-la-la/i,
  /^vinewood \(hd/i,
  /^the music locker/i,
  /^southern san andreas super autos/i,
  /^cayo perico$/i, // Location, not heist
  /^el rubio's compound/i,
  /^mobile phone/i,
  /^ron$/i,
  
  // Meta/Category pages
  /^missions in gta online/i,
  /^random events in gta/i,
  /^wanted level in gta/i,
  /^festive surprise/i,
  /^gta online protagonist/i,
  /\/preparations$/i, // Heist preparation pages
  /\/finale$/i, // Heist finale pages (keep actual heists)
  
  // Music/DJs
  /^keinemusik/i,
  /^moodymann/i,
  /^palms trax/i,
  
  // Duplicate year entries
  /^20\d{2}$/i, // Just a year number
  
  // Other non-missions
  /^san andreas$/i, // Location
  /^oh no$/i, // Not a mission
  /^keep the pace/i,
  /^judgement day/i,
  /^overtime rumble/i,
  /^tiny racers/i,
  /^till death do us part/i,
  /^the vespucci job \(remix\)/i,
];

async function cleanupNonGrinding() {
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
  console.log('🧹 CLEANING NON-GRINDING ACTIVITIES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const activities = await allAsync('SELECT id, name FROM activities');
  
  const toDelete = activities.filter(activity => {
    return NON_GRINDING_PATTERNS.some(pattern => pattern.test(activity.name));
  });

  console.log(`Total activities: ${activities.length}`);
  console.log(`Activities to delete: ${toDelete.length}\n`);

  if (toDelete.length === 0) {
    console.log('✅ No non-grinding activities found.\n');
    db.close();
    return;
  }

  console.log('Activities marked for deletion:');
  toDelete.forEach((activity, i) => {
    if (i < 20) {
      console.log(`  - ${activity.name}`);
    }
  });
  if (toDelete.length > 20) {
    console.log(`  ... and ${toDelete.length - 20} more`);
  }

  console.log('\n⚠️  This will DELETE these activities and ALL related data (sessions, stats, etc.)');
  console.log('⚠️  Make sure you have a backup: cp gta_tracker.db gta_tracker.db.backup\n');

  // Delete activities and cascade
  let deleted = 0;
  for (const activity of toDelete) {
    try {
      // Delete related data first
      await runAsync('DELETE FROM sessions WHERE activity_id = ?', [activity.id]);
      await runAsync('DELETE FROM stats WHERE activity_id = ?', [activity.id]);
      await runAsync('DELETE FROM cooldowns WHERE activity_id = ?', [activity.id]);
      await runAsync('DELETE FROM resupply WHERE activity_id = ?', [activity.id]);
      await runAsync('DELETE FROM production_state WHERE activity_id = ?', [activity.id]);
      await runAsync('DELETE FROM sell_sessions WHERE activity_id = ?', [activity.id]);
      await runAsync('DELETE FROM safe_collections WHERE activity_id = ?', [activity.id]);
      
      // Delete activity
      await runAsync('DELETE FROM activities WHERE id = ?', [activity.id]);
      deleted++;
    } catch (err) {
      console.error(`Error deleting ${activity.name}:`, err.message);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 CLEANUP REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`Activities deleted: ${deleted}`);
  console.log(`Activities remaining: ${activities.length - deleted}\n`);
  console.log('✅ CLEANUP COMPLETE\n');

  db.close();
}

cleanupNonGrinding().catch(err => {
  console.error('Cleanup failed:', err);
  process.exitCode = 1;
});
