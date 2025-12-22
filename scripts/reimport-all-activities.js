/**
 * Script para re-importar todas las actividades de GTA Online desde la wiki
 * Recupera misiones, contratos, atracos, negocios y todo lo que genere dinero
 */

const API_BASE = 'http://localhost:3000/api/gta';

// Configuración de importaciones por página de la wiki
const IMPORTS = [
  // HEISTS & MISSIONS
  {
    name: 'Original Heists',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'Heists',
      sectionIndices: [2, 3, 4, 5],
      activityCategory: 'heist',
      idPrefix: 'heist',
      variant: 'heist',
      release: 2015,
      pruneExisting: false,
      filterByCategoryKeyword: true,
      tags: ['heist']
    }
  },
  {
    name: 'Doomsday Heist',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'The_Doomsday_Heist',
      sectionIndices: [2, 3, 4],
      activityCategory: 'heist',
      idPrefix: 'doomsday',
      variant: 'heist',
      release: 2017,
      pruneExisting: false,
      filterByCategoryKeyword: true,
      tags: ['heist', 'doomsday']
    }
  },
  {
    name: 'Diamond Casino Heist',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'The_Diamond_Casino_Heist',
      sectionIndices: [2, 3, 4, 5],
      activityCategory: 'heist',
      idPrefix: 'casino',
      variant: 'heist',
      release: 2019,
      pruneExisting: false,
      filterByCategoryKeyword: true,
      tags: ['heist', 'casino']
    }
  },
  {
    name: 'Cayo Perico Heist',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'The_Cayo_Perico_Heist',
      sectionIndices: [2, 3, 4],
      activityCategory: 'heist',
      idPrefix: 'cayo',
      variant: 'heist',
      release: 2020,
      pruneExisting: false,
      filterByCategoryKeyword: true,
      tags: ['heist', 'cayo-perico']
    }
  },
  
  // CONTACT MISSIONS
  {
    name: 'Contact Missions',
    endpoint: '/import/wiki/category',
    body: {
      categoryName: 'Contact_Missions',
      activityCategory: 'mission',
      idPrefix: 'contact',
      variant: 'contact-mission',
      release: 2013,
      maxTitles: 150,
      pruneExisting: false,
      filterByCategoryKeyword: true,
      tags: ['contact-mission']
    }
  },
  
  // CONTRACTS & AGENCY
  {
    name: 'Agency Contracts',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'The_Contract',
      sectionIndices: [2, 3, 4, 5],
      activityCategory: 'contract',
      idPrefix: 'agency',
      variant: 'contract',
      release: 2021,
      pruneExisting: false,
      filterByCategoryKeyword: true,
      tags: ['contract', 'agency']
    }
  },
  {
    name: 'Security Contracts',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'Security_Contracts',
      sectionIndices: [1, 2, 3],
      activityCategory: 'contract',
      idPrefix: 'security',
      variant: 'contract',
      release: 2021,
      pruneExisting: false,
      filterByCategoryKeyword: true,
      tags: ['contract', 'security']
    }
  },
  
  // ROBBERIES & MINI-HEISTS
  {
    name: 'Auto Shop Robberies',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'Auto_Shop',
      sectionIndices: [3, 4],
      activityCategory: 'robbery',
      idPrefix: 'autoshop',
      variant: 'robbery',
      release: 2021,
      pruneExisting: false,
      filterByCategoryKeyword: true,
      tags: ['robbery', 'auto-shop']
    }
  },
  {
    name: 'Salvage Yard Robberies',
    endpoint: '/import/wiki/page-sections',
    body: {
      wikiPage: 'Salvage_Yard',
      sectionIndices: [2, 3],
      activityCategory: 'robbery',
      idPrefix: 'salvage',
      variant: 'robbery',
      release: 2023,
      pruneExisting: false,
      filterByCategoryKeyword: true,
      tags: ['robbery', 'salvage']
    }
  },
  
  // ADVERSARY MODES & SPECIAL MODES
  {
    name: 'Adversary Modes',
    endpoint: '/import/wiki/category',
    body: {
      categoryName: 'Adversary_Modes',
      activityCategory: 'mission',
      idPrefix: 'adversary',
      variant: 'adversary',
      release: 2015,
      maxTitles: 50,
      pruneExisting: false,
      filterByCategoryKeyword: false,
      tags: ['adversary', 'pvp']
    }
  },
  
  // BUSINESSES - MC, BUNKER, etc (estas son pasivas, no se importan de wiki)
  // Las actividades pasivas base ya están en baseActivities.js
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`✅ ${config.name}: ${result.totalImported || 0} activities imported`);
    console.log(`   Total found: ${result.totalFound || 0}, Filtered: ${result.totalFiltered || 0}`);
    
    return result;
  } catch (error) {
    console.error(`❌ ${config.name} failed:`, error.message);
    return null;
  }
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎮 GTA Online Activities Re-Import Script');
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
    
    // Wait 2 seconds between imports to avoid overwhelming the API
    if (i < IMPORTS.length - 1) {
      console.log('⏱️  Waiting 2 seconds...');
      await sleep(2000);
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 IMPORT SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Successful imports: ${successCount}/${IMPORTS.length}`);
  console.log(`❌ Failed imports: ${failCount}/${IMPORTS.length}`);
  console.log(`📦 Total activities imported: ${totalImported}`);
  console.log(`⏰ Completed at: ${new Date().toLocaleString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (totalImported > 0) {
    console.log('🎉 Re-import successful! Refresh your frontend to see activities.');
  } else {
    console.log('⚠️  No activities were imported. Check if the server is running on http://localhost:3000');
  }
}

// Run the script
main().catch(error => {
  console.error('\n💥 FATAL ERROR:', error);
  process.exit(1);
});
