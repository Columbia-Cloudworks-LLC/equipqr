
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';

interface StorageUsage {
  total_bytes: number;
  total_gb: number;
  free_gb: number;
  used_percentage: number;
  overage_bytes: number;
  overage_gb: number;
  overage_amount_cents: number;
  has_overage: boolean;
}

interface StorageBillingRecord {
  id: string;
  billing_period_start: string;
  billing_period_end: string;
  overage_gb: number;
  overage_amount_cents: number;
  status: string;
  created_at: string;
}

interface UseStorageUsageResult {
  storageUsage: StorageUsage | null;
  billingHistory: StorageBillingRecord[];
  isLoading: boolean;
  error: string | null;
  userRole: string | null;
  refreshUsage: () => Promise<void>;
}

export function useStorageUsage(): UseStorageUsageResult {
  const { user } = useAuth();
  const { selectedOrganization } = useOrganization();
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [billingHistory, setBillingHistory] = useState<StorageBillingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchStorageUsage = async () => {
    if (!user || !selectedOrganization) {
      setStorageUsage(null);
      setBillingHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching storage usage for organization:', selectedOrganization.id);

      const { data, error } = await supabase.functions.invoke('get-storage-usage', {
        body: {
          org_id: selectedOrganization.id
        }
      });

      if (error) {
        console.error('Storage usage check error:', error);
        setError(error.message || 'Failed to check storage usage');
        return;
      }

      console.log('Storage usage result:', data);
      setStorageUsage(data.storage_usage);
      setBillingHistory(data.billing_history || []);
      setUserRole(data.user_role || null);

    } catch (err) {
      console.error('Error checking storage usage:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageUsage();
  }, [user, selectedOrganization]);

  return {
    storageUsage,
    billingHistory,
    isLoading,
    error,
    userRole,
    refreshUsage: fetchStorageUsage
  };
}
