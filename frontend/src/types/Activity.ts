export interface Activity {
  // Required fields
  id: string;
  name: string;
  category: ActivityCategory;
  
  // Core optional fields
  variant?: string;
  solo?: boolean;
  passive?: boolean;
  deprecated?: boolean;
  source?: 'dataset' | 'wiki' | 'manual' | 'legacy';
  
  // Payout and timing (optional, can be null until verified)
  avgPayout?: number | null;
  avgTimeMin?: number | null;
  efficiency?: number | null;
  payoutType?: PayoutType;
  
  // Cooldowns
  minCooldown?: number | null;
  cooldownMinutes?: number | null;
  cooldowns?: Record<string, number> | null;
  
  // Production/Business fields
  productionMinutes?: number | null;
  supplyConsumptionMinutes?: number | null;
  resupplyMin?: number | null;
  maxStorage?: number | null;
  maxStock?: number | null;
  stockValue?: number | null;
  
  // Metadata
  release?: number;
  boostable?: boolean;
  modifiers?: string[];
  playersMin?: number | null;
  playersMax?: number | null;
  requires?: Record<string, unknown> | null;
  tags?: string[] | null;
  sourceUrl?: string | null;
  update?: string | null;
}

export interface ActivityStats {
  totalMoney: number;
  totalTime: number;
  count: number;
  dpm: number;
  lastSession?: string | Date;
}

export interface Session {
  id: string;
  activityId: string;
  startTime: string | Date;
  endTime?: string | Date;
  moneyEarned?: number;
  durationMinutes?: number;
}

export interface Cooldown {
  activityId: string;
  endTime: string | Date;
  notified: boolean;
}

export interface Resupply {
  activityId: string;
  endTime: string | Date;
  notified: boolean;
}

export interface ProductionState {
  activityId: string;
  currentStock: number;
  lastResupplyTime?: string | Date;
}

export interface SellSession {
  id: string;
  activityId: string;
  startTime: string | Date;
  endTime?: string | Date;
  moneyEarned?: number;
  activeMinutes?: number;
}

export interface SafeCollection {
  activityId: string;
  collectedAt: string | Date;
  moneyCollected: number;
}

export type ActivityCategory = 
  | 'mission'
  | 'heist'
  | 'business'
  | 'passive-business'
  | 'contract'
  | 'robbery'
  | 'mini-heist'
  | 'covert-ops'
  | 'challenge'
  | 'passive';

export type PayoutType = 'active' | 'passive';

export interface ActivityWithStats extends Activity {
  stats: ActivityStats;
}
