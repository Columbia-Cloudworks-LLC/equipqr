
import { useState, useEffect } from 'react';
import { useUserBilling } from './useUserBilling';

interface GracePeriodInfo {
  has_grace_period: boolean;
  grace_period_start?: string;
  grace_period_end?: string;
  days_remaining?: number;
  is_active?: boolean;
  has_been_notified?: boolean;
  exemption_aware?: boolean; // New field to indicate exemption-aware grace period
}

interface UseGracePeriodResult {
  gracePeriodInfo: GracePeriodInfo | null;
  isLoading: boolean;
  error: string | null;
  checkGracePeriod: () => Promise<void>;
}

export function useGracePeriod(): UseGracePeriodResult {
  const { gracePeriodInfo, isLoading, error, refreshBilling } = useUserBilling();

  // Enhance grace period info to be exemption-aware
  const enhancedGracePeriodInfo = gracePeriodInfo ? {
    ...gracePeriodInfo,
    exemption_aware: true
  } : null;

  return {
    gracePeriodInfo: enhancedGracePeriodInfo,
    isLoading,
    error,
    checkGracePeriod: refreshBilling
  };
}
