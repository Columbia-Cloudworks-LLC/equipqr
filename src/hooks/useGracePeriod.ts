
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';

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
  const { user } = useAuth();
  const { selectedOrganization } = useOrganization();
  const [gracePeriodInfo, setGracePeriodInfo] = useState<GracePeriodInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkGracePeriod = async () => {
    if (!user || !selectedOrganization) {
      setGracePeriodInfo(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Checking grace period for organization:', selectedOrganization.id);

      const { data, error } = await supabase.functions.invoke('get-grace-period-info', {
        body: {
          org_id: selectedOrganization.id
        }
      });

      if (error) {
        console.error('Grace period check error:', error);
        setError(error.message || 'Failed to check grace period');
        return;
      }

      console.log('Grace period result:', data);
      setGracePeriodInfo(data.grace_period_info);

    } catch (err) {
      console.error('Error checking grace period:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkGracePeriod();
  }, [user, selectedOrganization]);

  return {
    gracePeriodInfo,
    isLoading,
    error,
    checkGracePeriod
  };
}
