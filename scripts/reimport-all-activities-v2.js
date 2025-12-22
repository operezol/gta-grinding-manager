/**
 * Script MEJORADO para re-importar TODAS las actividades de GTA Online
 * Versión 2.0 - Corregido y expandido para recuperar 300+ actividades
 */

const API_BASE = 'http://localhost:3000/api/gta';

const IMPORTS = [
  // ============ HEISTS (Atracos) ============
  {
    name: 'Original Heists - Setup Missions',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'Heists',
      sectionIndices: [3, 4, 5, 6, 7],
      activityCategory: 'heist',
      idPrefix: 'heist-original',
      variant: 'heist',
      release: 2015,
      pruneExisting: false,
      filterByCategoryKeyword: false,
      tags: ['heist', 'setup']
    }
  },
  {
    name: 'Doomsday Heist - All Missions',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'The_Doomsday_Heist',
      sectionIndices: [3, 4, 5, 6],
      activityCategory: 'heist',
      idPrefix: 'doomsday',
      variant: 'heist',
      release: 2017,
      pruneExisting: false,
      filterByCategoryKeyword: false,
      tags: ['heist', 'doomsday']
    }
  },
  {
    name: 'Diamond Casino Heist - All Approaches',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'The_Diamond_Casino_Heist',
      sectionIndices: [3, 4, 5, 6, 7],
      activityCategory: 'heist',
      idPrefix: 'casino',
      variant: 'heist',
      release: 2019,
      pruneExisting: false,
      filterByCategoryKeyword: false,
      tags: ['heist', 'casino']
    }
  },
  {
    name: 'Cayo Perico Heist - Prep & Finale',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'The_Cayo_Perico_Heist',
      sectionIndices: [3, 4, 5],
      activityCategory: 'heist',
      idPrefix: 'cayo',
      variant: 'heist',
      release: 2020,
      pruneExisting: false,
      filterByCategoryKeyword: false,
      tags: ['heist', 'cayo-perico']
    }
  },

  // ============ CONTACT MISSIONS ============
  {
    name: 'Contact Missions (Category)',
    endpoint: '/import/wiki/category',
    body: {
      wikiCategory: 'Contact_Missions',
      activityCategory: 'mission',
      idPrefix: 'contact',
      variant: 'contact-mission',
      release: 2013,
      tags: ['contact-mission'],
      limit: 200,
      maxPages: 100,
      requestDelayMs: 100
    }
  },
  {
    name: 'Missions (General Category)',
    endpoint: '/import/wiki/category',
    body: {
      wikiCategory: 'Missions_in_GTA_Online',
      activityCategory: 'mission',
      idPrefix: 'mission',
      variant: 'mission',
      release: 2013,
      tags: ['mission'],
      limit: 150,
      maxPages: 80,
      requestDelayMs: 100
    }
  },

  // ============ AGENCY & CONTRACTS ============
  {
    name: 'The Contract - Dr. Dre Missions',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'The_Contract',
      sectionIndices: [3, 4, 5],
      activityCategory: 'contract',
      idPrefix: 'contract-dre',
      variant: 'contract',
      release: 2021,
      pruneExisting: false,
      filterByCategoryKeyword: false,
      tags: ['contract', 'agency', 'dr-dre']
    }
  },
  {
    name: 'Security Contracts',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'Security_Contracts',
      sectionIndices: [2, 3, 4],
      activityCategory: 'contract',
      idPrefix: 'security',
      variant: 'contract',
      release: 2021,
      pruneExisting: false,
      filterByCategoryKeyword: false,
      tags: ['contract', 'security']
    }
  },
  {
    name: 'Payphone Hits',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'Payphone_Hits',
      sectionIndices: [1, 2],
      activityCategory: 'contract',
      idPrefix: 'payphone',
      variant: 'contract',
      release: 2021,
      pruneExisting: false,
      filterByCategoryKeyword: false,
      tags: ['contract', 'payphone', 'assassination']
    }
  },

  // ============ ROBBERIES ============
  {
    name: 'Auto Shop Robberies',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'Auto_Shop',
      sectionIndices: [4, 5],
      activityCategory: 'robbery',
      idPrefix: 'autoshop',
      variant: 'robbery',
      release: 2021,
      pruneExisting: false,
      filterByCategoryKeyword: false,
      tags: ['robbery', 'auto-shop']
    }
  },
  {
    name: 'Salvage Yard Robberies',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'Salvage_Yard',
      sectionIndices: [3, 4],
      activityCategory: 'robbery',
      idPrefix: 'salvage',
      variant: 'robbery',
      release: 2023,
      pruneExisting: false,
      filterByCategoryKeyword: false,
      tags: ['robbery', 'salvage']
    }
  },
  {
    name: 'Fleeca Job',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'The_Fleeca_Job',
      sectionIndices: [2, 3],
      activityCategory: 'heist',
      idPrefix: 'fleeca',
      variant: 'heist',
      release: 2015,
      pruneExisting: false,
      filterByCategoryKeyword: false,
      tags: ['heist', 'fleeca']
    }
  },

  // ============ ADVERSARY & SPECIAL MODES ============
  {
    name: 'Adversary Modes',
    endpoint: '/import/wiki/category',
    body: {
      wikiCategory: 'Adversary_Modes',
      activityCategory: 'mission',
      idPrefix: 'adversary',
      variant: 'adversary',
      release: 2015,
      tags: ['adversary', 'pvp'],
      limit: 100,
      maxPages: 50,
      requestDelayMs: 100
    }
  },

  // ============ SPECIAL CARGO & CEO ============
  {
    name: 'Special Cargo Missions',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'Special_Cargo',
      sectionIndices: [2, 3],
      activityCategory: 'mission',
      idPrefix: 'cargo',
      variant: 'mission',
      release: 2016,
      pruneExisting: false,
      filterByCategoryKeyword: false,
      tags: ['ceo', 'cargo']
    }
  },
  {
    name: 'VIP/CEO Work',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'VIP/CEO_Abilities',
      sectionIndices: [2, 3, 4],
      activityCategory: 'mission',
      idPrefix: 'vip',
      variant: 'mission',
      release: 2015,
      pruneExisting: false,
      filterByCategoryKeyword: false,
      tags: ['vip', 'ceo']
    }
  },

  // ============ MOTORCYCLE CLUB (MC) ============
  {
    name: 'MC Contracts',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'Clubhouse_Contracts',
      sectionIndices: [1, 2],
      activityCategory: 'contract',
      idPrefix: 'mc',
      variant: 'contract',
      release: 2016,
      pruneExisting: false,
      filterByCategoryKeyword: false,
      tags: ['mc', 'contract']
    }
  },

  // ============ GUNRUNNING & SMUGGLING ============
  {
    name: 'Gunrunning Missions',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'Gunrunning',
      sectionIndices: [3, 4],
      activityCategory: 'mission',
      idPrefix: 'gunrunning',
      variant: 'mission',
      release: 2017,
      pruneExisting: false,
      filterByCategoryKeyword: false,
      tags: ['gunrunning', 'bunker']
    }
  },
  {
    name: 'Smuggler\'s Run Air Freight',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'Smuggler\'s_Run',
      sectionIndices: [2, 3],
      activityCategory: 'mission',
      idPrefix: 'smuggler',
      variant: 'mission',
      release: 2017,
      pruneExisting: false,
      filterByCategoryKeyword: false,
      tags: ['smuggler', 'hangar']
    }
  },

  // ============ FREEMODE EVENTS ============
  {
    name: 'Freemode Events',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'Freemode_Events',
      sectionIndices: [1, 2, 3],
      activityCategory: 'mission',
      idPrefix: 'freemode',
      variant: 'mission',
      release: 2015,
      pruneExisting: false,
      filterByCategoryKeyword: false,
      tags: ['freemode', 'event']
    }
  },

  // ============ CLIENT JOBS (Nightclub) ============
  {
    name: 'Client Jobs',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'Client_Jobs',
      sectionIndices: [1, 2],
      activityCategory: 'mission',
      idPrefix: 'client',
      variant: 'mission',
      release: 2018,
      pruneExisting: false,
      filterByCategoryKeyword: false,
      tags: ['nightclub', 'client-job']
    }
  },

  // ============ ARENA WAR ============
  {
    name: 'Arena War Modes',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'Arena_War',
      sectionIndices: [2, 3, 4],
      activityCategory: 'mission',
      idPrefix: 'arena',
      variant: 'mission',
      release: 2018,
      pruneExisting: false,
      filterByCategoryKeyword: false,
      tags: ['arena-war', 'pvp']
    }
  },
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function importActivities(config) {
  const url = `${API_BASE}${config.endpoint}`;
  console.log(`\n🔄 Importing: ${config.name}...`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config.body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`✅ ${config.name}: ${result.totalImported || 0} activities imported`);
    if (result.totalFound !== undefined) {
      console.log(`   Total found: ${result.totalFound}, Filtered: ${result.totalFiltered || result.totalImported || 0}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ ${config.name} failed:`, error.message);
    return null;
  }
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎮 GTA Online Activities Re-Import Script v2.0');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Starting at: ${new Date().toLocaleString()}`);
  console.log(`Total import configurations: ${IMPORTS.length}\n`);
  
  let totalImported = 0;
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < IMPORTS.length; i++) {
    const config = IMPORTS[i];
    console.log(`[${i + 1}/${IMPORTS.length}]`, '='.repeat(50));
    
    const result = await importActivities(config);
    
    if (result) {
      successCount++;
      totalImported += (result.totalImported || 0);
    } else {
      failCount++;
    }
    
    // Wait 1.5 seconds between imports
    if (i < IMPORTS.length - 1) {
      console.log('⏱️  Waiting 1.5 seconds...');
      await sleep(1500);
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 IMPORT SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Successful imports: ${successCount}/${IMPORTS.length}`);
  console.log(`❌ Failed imports: ${failCount}/${IMPORTS.length}`);
  console.log(`📦 Total NEW activities imported: ${totalImported}`);
  console.log(`📦 Total activities in DB (with base ~45): ~${totalImported + 45}`);
  console.log(`⏰ Completed at: ${new Date().toLocaleString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (totalImported > 0) {
    console.log('🎉 Re-import successful! Refresh your frontend (F5) to see all activities.');
    console.log('💡 Tip: Sort by "Eficiencia" to see best activities at the top.');
  } else {
    console.log('⚠️  No activities were imported. Check if the server is running on http://localhost:3000');
  }
}

main().catch(error => {
  console.error('\n💥 FATAL ERROR:', error);
  process.exit(1);
});
