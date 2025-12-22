const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'gta_tracker.db');

const NON_PAYING_TITLES = [
  'Agatha Baker',
  'Agent 14',
  'Avon Hertz',
  'Blaine County Savings Bank',
  'Cam Jones',
  'Carl Johnson',
  'Derrick McReary',
  'El Rubio',
  'Juan Strickler',
  'English Dave',
  'Floyd Hebert',
  'Franklin Clinton',
  'Georgina Cheng',
  'Gerald McReary',
  'Hilary King',
  'Lester Crest',
  "Lester's Assassinations",
  'Lupe',
  'Malc',
  'Michael De Santa',
  'Michael Keane',
  'Miguel Madrazo',
  'Natalia Zverovna',
  'Niko Bellic',
  'Paige Harris',
  'Patrick McReary',
  'Pavel',
  'Phil Cassidy',
  'Steve Haines',
  'Tao Cheng',
  'Thornton Duggan',
  'Tom Connors',
  'Trevor Philips',
  'Vincent',
  'Wade Hebert',
  'Wu Zi Mu',
  'Yung Ancestor',
  'Zero',

  '24/7',
  'Alta',
  'Boulevard Del Perro',
  'Chamberlain Hills',
  'Clinton Avenue',
  'Clinton Residence',
  'Dashound Bus Center',
  'Discount Store',
  'East Joshua Road',
  'El Burro Heights',
  'El Burro Heights Fire Station',
  'Federal Investigation Bureau',
  'Fleeca',
  'Flywheels Garage',
  'Forum Drive',
  'Globe Oil',
  'Grand Senora Desert',
  'Grapeseed',
  'Grapeseed Main Street',
  'Grove Street',
  'Harmony',
  'Integrity Way',
  'Jamestown Street',
  'Jetsam Terminal HQ',
  'Lago Zancudo',
  'Las Lagunas Boulevard',
  'Liquor Ace',
  'Little Havana',
  'Little Seoul',
  'Little Seoul Station',
  'Los Santos County Sheriff',
  'Los Santos Police Department',
  'Los Santos Tattoos',
  'Macdonald Street',
  'Meringue Lane',
  'Mirror Park',
  'Mirror Park Boulevard',
  'Morningwood',
  'Morningwood Boulevard',
  'North Rockford Drive',
  'Occupation Avenue',
  'Pala Springs',
  'Pala Springs Aerial Tramway',
  'Paleto Bay',
  'Paleto Forest',
  'Palomino Avenue',
  'Rancho',
  "Rex's Diner",
  'Richman Glen',
  'Route 68',
  'San Andreas Avenue',
  'Sandy Shores',
  'Sandy Shores Airfield',
  "Sandy's Gas Station",
  'Seaview Road',
  'Snr. Buns',
  'Strawberry',
  'Tataviam Mountains',
  'Tataviam Truckstop',
  'Tequilala',
  'Terminal',
  'Textile City',
  'The Motor Motel',
  'Vespucci Beach',
  'Vespucci Canals',
  'Vespucci Mall',
  'Vinewood',
  'West Mirror Drive',
  'West Vinewood',
  'Xero',
  'Yellow Jack Inn',
  'Zancudo River',

  'Adversary Modes',
  'Awards',
  'Bank of Liberty',
  'Bigfoot',
  'Business Battles',
  'Chips',
  'Cops Capacity',
  'El Banco Corrupto Grande',
  'Events',
  'FIB Headquarters',
  'Freemode Challenges',
  'GTA Online: After Hours',
  'GTA Online: Heists',
  'GTA Online: The Criminal Enterprises',
  'GTA Online: The Cayo Perico Heist',
  'GTA Online: The Diamond Casino Heist',
  'GTA Online: The Doomsday Heist',
  'Grand Theft Auto Online',
  'Grand Theft Auto V',
  'Heists in GTA Online',
  'Heists in GTA V',
  'Hidden Caches',
  'Legendary Motorsport',
  'Los Santos (HD Universe)',
  'Minigun',
  'Money',
  'Motorcycle Clubs',
  'Nightclubs',
  'Offices',
  'Organizations',
  'Passive Mode',
  'Pause Menu',
  'Perico Pistol',
  'Reputation',
  'Rockstar Games',
  'Security Contracts',
  'Special Cargo / Warehouses',
  'State of San Andreas',
  'The Big Score (GTA V)',
  'The Bureau Raid',
  'The Diamond Casino & Resort',
  'The Jewel Store Job',
  'The Job',
  'The Merryweather Heist',
  'The Pacific Standard Job',
  'The Paleto Score',
  'The Prison Break',
  'The Vespucci Job',
  'The Vespucci Job Remix',
  'Three Leaf Clover',
  'Time Trials',
  'Vehicle Mines',
  'Wasted',
  'Weaponized Vehicles',
  'Weapons of Choice',
  'Warehouse Staff',
  'Weevil',

  'Bombushka',
  'Cargobob',
  'Deathbike',
  'Drones',
  'Imperator',
  'Issi Classic',
  'RC Bandito',
  'Sasquatch',
  'Terrorbyte',
  'Itali RSX',

  'Clubhouses',
  'Gunrunning',
  'Money Fronts',
  'SecuroServ',
  'Warehouses',

  'Breaking the Bank at Caligula\'s',
  'The Doomsday Heist',
];

const normalizeTitle = (s) => String(s || '').trim().toLowerCase();

async function run() {
  const db = new sqlite3.Database(DB_PATH);

  const selectAll = () =>
    new Promise((resolve, reject) => {
      db.all('SELECT id, name FROM activities', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

  const runSql = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes || 0 });
      });
    });

  const allRows = await selectAll();
  const block = new Set(NON_PAYING_TITLES.map(normalizeTitle));
  const toDelete = allRows.filter((r) => block.has(normalizeTitle(r.name)));

  if (toDelete.length === 0) {
    console.log('No matching non-paying activities found. Nothing to delete.');
    db.close();
    return;
  }

  const ids = toDelete.map((r) => r.id);

  console.log(`Found ${toDelete.length} non-paying activities to delete.`);
  console.log(toDelete.slice(0, 20).map((r) => `- ${r.name} (${r.id})`).join('\n'));
  if (toDelete.length > 20) console.log(`... +${toDelete.length - 20} more`);

  const placeholders = ids.map(() => '?').join(',');

  const tablesByActivityId = [
    'stats',
    'sessions',
    'sell_sessions',
    'cooldowns',
    'resupply',
    'production_state',
    'safe_collections',
  ];

  for (const table of tablesByActivityId) {
    const result = await runSql(`DELETE FROM ${table} WHERE activity_id IN (${placeholders})`, ids);
    console.log(`Deleted ${result.changes} rows from ${table}`);
  }

  const resultActivities = await runSql(`DELETE FROM activities WHERE id IN (${placeholders})`, ids);
  console.log(`Deleted ${resultActivities.changes} rows from activities`);

  db.close();
}

run().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exitCode = 1;
});
