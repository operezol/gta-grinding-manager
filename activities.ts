import type { Activity } from '../types';

export const ACTIVITIES_DATA: Activity[] = [
  {
    id: 'contact-missions',
    variant: 'base',
    name: 'Misiones de Contacto',
    category: 'mission',
    release: 2013,
    boostable: false,
    modifiers: [],
    minCooldown: 0,
    avgTimeMin: 12,
    avgPayout: 30000,
    efficiency: 2500,
    payoutType: 'active',
    solo: true,
    passive: false
  },
  {
    id: 'vip-work',
    variant: 'base',
    name: 'VIP Work (CEO)',
    category: 'mission',
    release: 2015,
    boostable: false,
    modifiers: [],
    minCooldown: 5,
    avgTimeMin: 5,
    avgPayout: 25000,
    efficiency: 5000,
    payoutType: 'active',
    solo: true,
    passive: false
  },
  {
    id: 'fleeca-job',
    variant: 'base',
    name: 'The Fleeca Job',
    category: 'heist',
    release: 2015,
    boostable: false,
    modifiers: [],
    minCooldown: 0,
    avgTimeMin: 30,
    avgPayout: 150000,
    efficiency: 5000,
    payoutType: 'active',
    solo: false,
    passive: false
  },
  {
    id: 'pacific-standard',
    variant: 'base',
    name: 'Pacific Standard',
    category: 'heist',
    release: 2015,
    boostable: false,
    modifiers: [],
    minCooldown: 0,
    avgTimeMin: 45,
    avgPayout: 1200000,
    efficiency: 26666,
    payoutType: 'active',
    solo: false,
    passive: false
  },
  {
    id: 'import-export',
    variant: 'base',
    name: 'Importación / Exportación',
    category: 'business',
    release: 2016,
    boostable: false,
    modifiers: [],
    minCooldown: 20,
    avgTimeMin: 15,
    avgPayout: 80000,
    efficiency: 5333,
    payoutType: 'active',
    solo: true,
    passive: false
  },
  {
    id: 'mc-coke',
    variant: 'base',
    name: 'MC Cocaína',
    category: 'passive-business',
    release: 2016,
    boostable: true,
    modifiers: [],
    minCooldown: 0,
    resupplyMin: 150,
    avgTimeMin: 0,
    avgPayout: 420000,
    efficiency: 0,
    payoutType: 'passive',
    solo: true,
    passive: true
  },
  {
    id: 'bunker',
    variant: 'base',
    name: 'Búnker (Gunrunning)',
    category: 'passive-business',
    release: 2017,
    boostable: true,
    modifiers: [],
    minCooldown: 0,
    resupplyMin: 140,
    avgTimeMin: 0,
    avgPayout: 1050000,
    efficiency: 0,
    payoutType: 'passive',
    solo: true,
    passive: true
  },
  {
    id: 'nightclub',
    variant: 'base',
    name: 'Nightclub Warehouse',
    category: 'passive-business',
    release: 2018,
    boostable: true,
    modifiers: [],
    minCooldown: 0,
    avgTimeMin: 5,
    avgPayout: 1800000,
    efficiency: 360000,
    payoutType: 'passive',
    solo: true,
    passive: true
  },
  {
    id: 'casino-heist',
    variant: 'base',
    name: 'Golpe al Casino Diamond',
    category: 'heist',
    release: 2019,
    boostable: false,
    modifiers: [],
    minCooldown: 144,
    avgTimeMin: 90,
    avgPayout: 2300000,
    efficiency: 25555,
    payoutType: 'active',
    solo: false,
    passive: false
  },
  {
    id: 'cayo-perico',
    variant: 'base',
    name: 'Cayo Perico (Solo)',
    category: 'heist',
    release: 2020,
    boostable: true,
    modifiers: [],
    minCooldown: 144,
    avgTimeMin: 60,
    avgPayout: 1100000,
    efficiency: 18333,
    payoutType: 'active',
    solo: true,
    passive: false
  }
];

export const initializeActivities = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/gta/bulk/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ACTIVITIES_DATA),
    });
    
    if (!response.ok) {
      throw new Error('Failed to initialize activities');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error initializing activities:', error);
    throw error;
  }
};