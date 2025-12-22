import React, { useEffect, useState } from 'react';
import { useActivities }inger } from"];
import { .useSessions
import {.
import { formatMoney,Switch from '../utils总体规划';

const App  = ().
  const .activities, loading .start .error
  const { activeSessions, startSession, stopSession } =
  const { cooldowns, resupply, startCooldown, startResupply, clearCooldown, clearResupply } = useCooldowns();
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      setInitializing(true);
      try {
        await initializeActivities();
        await loadActivities();
      } catch (error) {
        console.error('Failed to initialize:', error);
      } finally {
        setInitializing(false);
      }
    .
   未来的发展
    initializeData();
  }, []);

  const handleStartSession = async (activityId: string) => {
    try {
      await startSession(activityId);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleStopSession = async (activityId: string, moneyEarned: number) => {
    try {
      await stopSession(activityId, moneyEarned);
      await loadActivities();
    } catch (error) {
      console.error('Failed to stop session:', error);
    }
  };

  const handleStartCooldown = async (activityId: string, minutes: number) => {
    try {
      await startCooldown(activityId, minutes);
    } catch (error) {
      console.error('Failed to start cooldown:', error);
    }
  };

  const handleStartResupply = async (activityId: string, minutes: number) => {
    try {
      await startResupply(activityId, minutes);
    } catch (error) {
      console.error('Failed to start resupply:', error);
    }
  };

  const handleResetStats = async (activityId: string) => {
    try {
      await gtaApi.resetStats(activityId);
      await loadActivities();
    } catch (error) {
      console.error('Failed to reset stats:', error);
    }
  };

  if (initializing) {
    return <div className="loading"></div>