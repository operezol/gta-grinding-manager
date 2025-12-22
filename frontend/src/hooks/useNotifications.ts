import { useEffect, useRef, useState, useCallback } from 'react';
import type { Cooldown, Resupply } from '../types';

export type PendingNotification = {
  id: string;
  activityId: string;
  activityName: string;
  type: 'cooldown' | 'resupply' | 'safe' | 'passive-ready';
  timestamp: number;
  value?: number;
};

type Activity = {
  id: string;
  name: string;
  category?: string;
  avgTimeMin?: number;
  avgPayout?: number;
  passive?: boolean;
  resupplyMin?: number;
};

type SellSession = {
  id: number | string;
  activityId: string;
  startTime: string | Date;
  endTime?: string | Date;
};

export function useNotifications(
  cooldowns: Cooldown[],
  resupplies: Resupply[],
  activities: Activity[],
  sellSessions?: SellSession[]
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notifiedIds = useRef<Set<string>>(new Set());
  const browserNotificationsRef = useRef<Map<string, Notification>>(new Map());
  const toastElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const scheduledTimersRef = useRef<Map<string, number>>(new Map());
  const [pendingNotifications, setPendingNotifications] = useState<PendingNotification[]>([]);

  useEffect(() => {
    // Create audio element on mount
    if (!audioRef.current) {
      audioRef.current = new Audio();
      // Using a simple beep sound data URL
      audioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi78OWhUhELSKDh8bllHAU6k9j0yXksBSF0xO/glEINFmO785+gUxQLSKXi8bVkHAU7lNn0yHksBCF0xPDglEINFmS985+gUxQLSKXi8bVjHAU7lNn0yHksBCF0xPDglEINFmS985+gUxQLSKXi8bVjHAU7lNn0yHksBCF0xPDglEINFmS985+gUxQLSKXi8bVjHAU7lNn0yHksBCF0xPDglEINFmS985+gUxQLSKXi8bVjHAU7lNn0yHksBCF0xPDglEINFmS985+gUxQLSKXi8bVjHAU7lNn0yHksBCF0xPDglEINFmS985+gUxQLSKXi8bVjHAU7lNn0yHksBCF0xPDglEINFmS985+gUxQLSKXi8bVjHAU7lNn0yHksBCF0xPDglEINFmS985+gUxQLSKXi8bVjHAU7lNn0yHksBCF0xPDglEINFmS985+gUxQLSKXi8bVjHAU7lNn0yHksBCF0xPDglEINFmS985+gUxQLSKXi8bVjHAU7lNn0yHksBCF0xPDglEINFmS985+gUxQLSKXi8bVjHAU7lNn0yHksBCF0xPDglEINFmS985+gUxQLSKXi8bVjHAU7lNn0yHksBCF0xPDglEINFmS985+gUxQLSKXi8bVjHAU7lNn0yHksBCF0xPDglEINFmS985+gUxQLSKXi8bVjHAU7lNn0yHksBCF0xPDglEINFmS985+gUxQLSKXi8bVjHAU7lNn0yHksBCF0xPDglEINFmS985+gUxQLSKXi8bVjHA==';
      audioRef.current.volume = 0.5;
    }
  }, []);

  useEffect(() => {
    const now = Date.now();
    const activitiesMap = new Map(activities.map(a => [a.id, a.name]));
    
    // Check cooldowns
    for (const cooldown of cooldowns) {
      const key = `cooldown-${cooldown.activityId}`;
      const endTime = new Date(cooldown.endTime).getTime();

      if (endTime > now && !notifiedIds.current.has(key) && !scheduledTimersRef.current.has(key)) {
        const delay = Math.max(0, endTime - now + 250);
        const timeoutId = window.setTimeout(() => {
          if (notifiedIds.current.has(key)) return;
          notifiedIds.current.add(key);
          const activityName = activitiesMap.get(cooldown.activityId) || cooldown.activityId;

          const notification: PendingNotification = {
            id: key,
            activityId: cooldown.activityId,
            activityName,
            type: 'cooldown',
            timestamp: Date.now(),
          };

          setPendingNotifications(prev => [...prev, notification]);
          audioRef.current?.play().catch(err => console.warn('Audio play failed:', err));
          showNotification(notification, browserNotificationsRef, toastElementsRef);
          scheduledTimersRef.current.delete(key);
        }, delay);
        scheduledTimersRef.current.set(key, timeoutId);
      }
      
      if (endTime <= now && !notifiedIds.current.has(key)) {
        notifiedIds.current.add(key);
        const activityName = activitiesMap.get(cooldown.activityId) || cooldown.activityId;
        
        const notification: PendingNotification = {
          id: key,
          activityId: cooldown.activityId,
          activityName,
          type: 'cooldown',
          timestamp: now,
        };
        
        // Add to pending list
        setPendingNotifications(prev => [...prev, notification]);
        
        // Play sound
        audioRef.current?.play().catch(err => console.warn('Audio play failed:', err));
        
        // Show toast
        showNotification(notification, browserNotificationsRef, toastElementsRef);
      }
    }
    
    // Check resupplies
    for (const resupply of resupplies) {
      const key = `resupply-${resupply.activityId}`;
      const endTime = new Date(resupply.endTime).getTime();

      if (endTime > now && !notifiedIds.current.has(key) && !scheduledTimersRef.current.has(key)) {
        const delay = Math.max(0, endTime - now + 250);
        const timeoutId = window.setTimeout(() => {
          if (notifiedIds.current.has(key)) return;
          notifiedIds.current.add(key);
          const activityName = activitiesMap.get(resupply.activityId) || resupply.activityId;

          const notification: PendingNotification = {
            id: key,
            activityId: resupply.activityId,
            activityName,
            type: 'resupply',
            timestamp: Date.now(),
          };

          setPendingNotifications(prev => [...prev, notification]);
          audioRef.current?.play().catch(err => console.warn('Audio play failed:', err));
          showNotification(notification, browserNotificationsRef, toastElementsRef);
          scheduledTimersRef.current.delete(key);
        }, delay);
        scheduledTimersRef.current.set(key, timeoutId);
      }
      
      if (endTime <= now && !notifiedIds.current.has(key)) {
        notifiedIds.current.add(key);
        const activityName = activitiesMap.get(resupply.activityId) || resupply.activityId;
        
        const notification: PendingNotification = {
          id: key,
          activityId: resupply.activityId,
          activityName,
          type: 'resupply',
          timestamp: now,
        };
        
        // Add to pending list
        setPendingNotifications(prev => [...prev, notification]);
        
        // Play sound
        audioRef.current?.play().catch(err => console.warn('Audio play failed:', err));
        
        // Show toast
        showNotification(notification, browserNotificationsRef, toastElementsRef);
      }
    }
    
    // Check safes and passive businesses ready (Nightclub, Money Fronts, etc.)
    if (sellSessions) {
      for (const activity of activities) {
        // Only check passive businesses without resupplies (safes, nightclub, money fronts)
        if (activity.passive && (!activity.resupplyMin || activity.resupplyMin === 0) && activity.avgTimeMin && activity.avgTimeMin > 0) {
          // Find last completed sell session for this activity
          const lastSell = sellSessions
            .filter(s => s.activityId === activity.id && s.endTime)
            .sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime())[0];
          
          if (lastSell) {
            const key = activity.category === 'safe' ? `safe-${activity.id}` : `passive-ready-${activity.id}`;
            const sellEndTime = new Date(lastSell.endTime!).getTime();
            const readyTime = sellEndTime + (activity.avgTimeMin * 60 * 1000);
            
            if (readyTime <= now && !notifiedIds.current.has(key)) {
              notifiedIds.current.add(key);
              
              const notification: PendingNotification = {
                id: key,
                activityId: activity.id,
                activityName: activity.name,
                type: activity.category === 'safe' ? 'safe' : 'passive-ready',
                timestamp: now,
                value: activity.avgPayout,
              };
              
              setPendingNotifications(prev => [...prev, notification]);
              audioRef.current?.play().catch(err => console.warn('Audio play failed:', err));
              showNotification(notification, browserNotificationsRef, toastElementsRef);
            }
          }
        }
      }
    }
    
    // Cleanup notified IDs that are no longer active
    const activeCooldownIds = new Set(cooldowns.map(c => `cooldown-${c.activityId}`));
    const activeResupplyIds = new Set(resupplies.map(r => `resupply-${r.activityId}`));

    for (const [key, t] of scheduledTimersRef.current) {
      if (!activeCooldownIds.has(key) && !activeResupplyIds.has(key)) {
        window.clearTimeout(t);
        scheduledTimersRef.current.delete(key);
      }
    }
    
    for (const key of notifiedIds.current) {
      if (!activeCooldownIds.has(key) && !activeResupplyIds.has(key) && !key.startsWith('safe-') && !key.startsWith('passive-ready-')) {
        notifiedIds.current.delete(key);
      }
    }
  }, [cooldowns, resupplies, activities, sellSessions]);

  const dismissNotification = useCallback((id: string) => {
    setPendingNotifications(prev => prev.filter(n => n.id !== id));

    const bn = browserNotificationsRef.current.get(id);
    if (bn) {
      bn.close();
      browserNotificationsRef.current.delete(id);
    }

    const toastEl = toastElementsRef.current.get(id);
    if (toastEl) {
      if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
      toastElementsRef.current.delete(id);
    }
  }, []);

  const clearAllNotifications = useCallback(() => {
    setPendingNotifications([]);

    for (const bn of browserNotificationsRef.current.values()) {
      bn.close();
    }
    browserNotificationsRef.current.clear();

    for (const toastEl of toastElementsRef.current.values()) {
      if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
    }
    toastElementsRef.current.clear();
  }, []);

  return {
    pendingNotifications,
    dismissNotification,
    clearAllNotifications,
  };
}

function showNotification(
  data: PendingNotification,
  browserNotificationsRef: React.MutableRefObject<Map<string, Notification>>,
  toastElementsRef: React.MutableRefObject<Map<string, HTMLDivElement>>
) {
  let message = '';
  switch (data.type) {
    case 'cooldown':
      message = `✅ ${data.activityName} is ready`;
      break;
    case 'resupply':
      message = `🔔 ${data.activityName} needs resupply`;
      break;
    case 'safe':
      message = `💰 ${data.activityName} is full (${data.value ? `$${(data.value / 1000).toFixed(0)}k` : 'collect'})`;
      break;
    case 'passive-ready':
      message = `🏢 ${data.activityName} is ready to sell (${data.value ? `$${(data.value / 1000).toFixed(0)}k` : 'available'})`;
      break;
  }
  
  // Browser notification
  if ('Notification' in window && Notification.permission === 'granted') {
    const n = new Notification('GTA Grinding Manager', {
      body: message,
      icon: '/vite.svg',
      tag: `${data.type}-${data.activityId}`,
    });
    browserNotificationsRef.current.set(data.id, n);
  }
  
  // Visual toast notification
  const toast = document.createElement('div');
  toast.className = 'notification-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${data.type === 'cooldown' ? '#28a745' : data.type === 'resupply' ? '#17a2b8' : data.type === 'safe' ? '#ffc107' : '#6f42c1'};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-weight: 500;
    font-size: 16px;
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(toast);
  toastElementsRef.current.set(data.id, toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
      toastElementsRef.current.delete(data.id);
    }, 300);
  }, 5000);
}
