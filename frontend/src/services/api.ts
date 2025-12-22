import axios from 'axios';
import type { Activity, ActivityStats, Session, Cooldown, Resupply, ProductionState, SellSession, SafeCollection } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const gtaApi = {
  // Activities
  getActivities: (): Promise<Activity[]> => 
    api.get('/gta/activities').then(res => res.data),
  
  getActivity: (id: string): Promise<Activity> => 
    api.get(`/gta/activities/${id}`).then(res => res.data),
  
  createActivity: (activity: Activity): Promise<Activity> => 
    api.post('/gta/activities', activity).then(res => res.data),
  
  updateActivity: (id: string, activity: Partial<Activity>): Promise<Activity> => 
    api.put(`/gta/activities/${id}`, activity).then(res => res.data),

  // Stats
  getAllStats: (): Promise<Record<string, ActivityStats>> => 
    api.get('/gta/stats').then(res => res.data),
  
  getActivityStats: (id: string): Promise<ActivityStats> => 
    api.get(`/gta/stats/${id}`).then(res => res.data),

  // Sessions
  createSession: (session: Omit<Session, 'id'>): Promise<Session> => 
    api.post('/gta/sessions', session).then(res => res.data),
  
  updateSession: (id: string, session: Partial<Session>): Promise<Session> => 
    api.put(`/gta/sessions/${id}`, session).then(res => res.data),
  
  getRecentSessions: (): Promise<Session[]> => 
    api.get('/gta/sessions').then(res => res.data),

  // Cooldowns
  startCooldown: (cooldown: Omit<Cooldown, 'notified'>): Promise<Cooldown> => 
    api.post('/gta/cooldowns', cooldown).then(res => res.data),
  
  getActiveCooldowns: (): Promise<Cooldown[]> => 
    api.get('/gta/cooldowns').then(res => 
      res.data.map((c: any) => ({
        activityId: c.activity_id ?? c.activityId,
        endTime: c.end_time ?? c.endTime,
        notified: c.notified,
      }))
    ),
  
  clearCooldown: (id: string): Promise<void> => 
    api.delete(`/gta/cooldowns/${id}`).then(() => {}),

  // Resupply
  startResupply: (resupply: Omit<Resupply, 'notified'>): Promise<Resupply> => 
    api.post('/gta/resupply', resupply).then(res => res.data),
  
  getActiveResupply: (): Promise<Resupply[]> => 
    api.get('/gta/resupply').then(res => 
      res.data.map((r: any) => ({
        activityId: r.activity_id,
        endTime: r.end_time,
        notified: r.notified,
      }))
    ),
  
  clearResupply: (id: string): Promise<void> => 
    api.delete(`/gta/resupply/${id}`).then(() => {}),

  // Production state
  getAllProduction: (): Promise<ProductionState[]> =>
    api.get('/gta/production').then(res =>
      res.data.map((p: any) => ({
        activityId: p.activity_id ?? p.activityId,
        currentStock: p.current_stock ?? p.currentStock,
        lastResupplyTime: p.last_resupply_time ?? p.lastResupplyTime,
      }))
    ),
  
  getProduction: (id: string): Promise<ProductionState | null> =>
    api.get(`/gta/production/${id}`).then(res => {
      if (!res.data) return null;
      const p: any = res.data;
      return {
        activityId: p.activity_id ?? p.activityId,
        currentStock: p.current_stock ?? p.currentStock,
        lastResupplyTime: p.last_resupply_time ?? p.lastResupplyTime,
      };
    }),
  
  updateProduction: (production: { activityId: string; currentStock: number }): Promise<ProductionState> =>
    api.post('/gta/production', production).then(res => res.data),
  
  clearProduction: (id: string): Promise<void> =>
    api.delete(`/gta/production/${id}`).then(() => {}),

  // Sell sessions
  createSellSession: (session: { activityId: string }): Promise<SellSession> =>
    api.post('/gta/sell-sessions', session).then(res => ({
      id: res.data.id,
      activityId: res.data.activity_id || res.data.activityId,
      startTime: res.data.start_time || res.data.startTime,
      endTime: res.data.end_time || res.data.endTime,
      moneyEarned: res.data.money_earned || res.data.moneyEarned,
    })),
  
  updateSellSession: (id: number, data: { moneyEarned: number; activeMinutes: number }): Promise<SellSession> =>
    api.put(`/gta/sell-sessions/${id}`, data).then(res => ({
      id: res.data.id,
      activityId: res.data.activity_id || res.data.activityId,
      startTime: res.data.start_time || res.data.startTime,
      endTime: res.data.end_time || res.data.endTime,
      moneyEarned: res.data.money_earned || res.data.moneyEarned,
    })),
  
  getActiveSellSessions: (): Promise<SellSession[]> =>
    api.get('/gta/sell-sessions').then(res => 
      res.data.map((s: any) => ({
        id: s.id,
        activityId: s.activity_id,
        startTime: s.start_time,
        endTime: s.end_time,
        moneyEarned: s.money_earned,
      }))
    ),

  // Safe collections
  collectSafe: (activityId: string, moneyCollected: number): Promise<SafeCollection> =>
    api.post(`/gta/safes/collect/${activityId}`, { moneyCollected }).then(res => ({
      activityId: res.data.activityId,
      collectedAt: res.data.collectedAt,
      moneyCollected: res.data.moneyCollected,
    })),
  
  getLastCollections: (): Promise<SafeCollection[]> =>
    api.get('/gta/safes/collections').then(res =>
      res.data.map((c: any) => ({
        activityId: c.activity_id,
        collectedAt: c.collected_at,
        moneyCollected: c.money_collected,
      }))
    ),

  // Stats management
  resetActivityStats: (id: string): Promise<void> =>
    api.delete(`/gta/stats/${id}`).then(() => {}),

  resetAllStats: (): Promise<void> =>
    api.delete('/gta/stats').then(() => {}),

  // Bulk operations
  bulkCreateActivities: (activities: Activity[]): Promise<Activity[]> => 
    api.post('/gta/bulk/activities', activities).then(res => res.data),
  
  bulkCreateSessions: (sessions: Session[]): Promise<Session[]> => 
    api.post('/gta/bulk/sessions', sessions).then(res => res.data),
};
