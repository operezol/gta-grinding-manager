import type { Activity } from '../types';
import { gtaApi } from '../services/api';

export const DEFAULT_ACTIVITIES: Activity[] = [
  {
    id: 'cayo_perico',
    variant: 'default',
    name: 'Cayo Perico Heist',
    category: 'heist',
    release: 2020,
    boostable: false,
    modifiers: [],
    minCooldown: 144,
    avgTimeMin: 60,
    avgPayout: 1400000,
    efficiency: 0,
    payoutType: 'active',
    solo: true,
    passive: false,
  },
];

export async function seedDefaultActivities() {
  return gtaApi.bulkCreateActivities(DEFAULT_ACTIVITIES);
}
