import { useState, useCallback, useEffect } from 'react';
import { gtaApi } from '../services/api';
import type { Cooldown, Resupply } from '../types';

export const useCooldowns = () => {
  const [cooldowns, setCooldowns] = useState<Cooldown[]>([]);
  const [resupply, setResupply] = useState<Resupply[]>([]);

  const loadCooldowns = useCallback(async () => {
    try {
      const [cooldownsData, resupplyData] = await Promise.all([
        gtaApi.getActiveCooldowns(),
        gtaApi.getActiveResupply()
      ]);
      setCooldowns(cooldownsData);
      setResupply(resupplyData);
    } catch (error) {
      console.error('Failed to load cooldowns:', error);
    }
  }, []);

  const startCooldown = useCallback(async (activityId: string, minutes: number) => {
    const endTime = new Date(Date.now() + minutes * 60 * 1000);
    
    try {
      await gtaApi.startCooldown({ activityId, endTime });
      await loadCooldowns();
    } catch (error) {
      console.error('Failed to start cooldown:', error);
      throw error;
    }
  }, [loadCooldowns]);

  const startResupply = useCallback(async (activityId: string, minutes: number) => {
    const endTime = new Date(Date.now() + minutes * 60 * 1000);
    
    try {
      await gtaApi.startResupply({ activityId, endTime });
      await loadCooldowns();
    } catch (error) {
      console.error('Failed to start resupply:', error);
      throw error;
    }
  }, [loadCooldowns]);

  const clearCooldown = useCallback(async (activityId: string) => {
    try {
      await gtaApi.clearCooldown(activityId);
      await loadCooldowns();
    } catch (error) {
      console.error('Failed to clear cooldown:', error);
      throw error;
    }
  }, [loadCooldowns]);

  const clearResupply = useCallback(async (activityId: string) => {
    try {
      await gtaApi.clearResupply(activityId);
      await loadCooldowns();
    } catch (error) {
      console.error('Failed to clear resupply:', error);
      throw error;
    }
  }, [loadCooldowns]);

  useEffect(() => {
    loadCooldowns();
    const interval = setInterval(loadCooldowns, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [loadCooldowns]);

  return { 
    cooldowns, 
    resupply, 
    startCooldown, 
    startResupply, 
    clearCooldown, 
    clearResupply 
  };
};