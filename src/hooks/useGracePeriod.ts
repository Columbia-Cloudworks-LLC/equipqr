
import { useState, useEffect } from 'react';
import { useUserBilling } from './useUserBilling';

interface GracePeriodInfo {
  has_grace_period: boolean;
  grace_period_start?: string;
  grace_period_end?: string;
  days_remaining?: number;
  is_active?: boolean;
  has_been_notified?: boolean;
}

interface UseGracePeriodResult {
  gracePeriodInfo: GracePeriodInfo | null;
  isLoading: boolean;
  error: string | null;
  checkGracePeriod: () => Promise<void>;
}

export function useGracePeriod(): UseGracePeriodResult {
  const { gracePeriodInfo, isLoading, error, refreshBilling } = useUserBilling();

  return {
    gracePeriodInfo,
    isLoading,
    error,
    checkGracePeriod: refreshBilling
  };
}
