
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { FeatureFlags } from '@/config/app';

interface FeatureAccessResult {
  has_access: boolean;
  subscription_details?: any;
  grace_period_info?: any;
  user_role?: string;
  reason?: string;
}

interface UseEnhancedFeatureAccessResult {
  hasAccess: boolean;
  isLoading: boolean;
  error: string | null;
  subscriptionDetails: any;
  gracePeriodInfo: any;
  userRole: string | null;
  checkAccess: () => Promise<void>;
  isOrgTransitioning: boolean;
}

export function useEnhancedFeatureAccess(featureKey: string): UseEnhancedFeatureAccessResult {
  const { user } = useAuth();
  const { selectedOrganization, isReady: orgContextReady } = useOrganization();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrgTransitioning, setIsOrgTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [gracePeriodInfo, setGracePeriodInfo] = useState(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const lastCheckedOrgRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkAccess = useCallback(async () => {
    if (!user || !selectedOrganization || !featureKey || !orgContextReady) {
      console.log('Enhanced Feature Access: Waiting for dependencies', {
        hasUser: !!user,
        hasOrg: !!selectedOrganization,
        hasFeatureKey: !!featureKey,
        orgContextReady
      });
      setHasAccess(false);
      setIsLoading(true);
      return;
    }

    // Check if feature is enabled in configuration
    const featureConfig = FeatureFlags[featureKey as keyof typeof FeatureFlags];
    if (!featureConfig?.enabled) {
      console.log('Enhanced Feature Access: Feature disabled in config', featureKey);
      setHasAccess(false);
      setIsLoading(false);
      setError('Feature is currently disabled');
      return;
    }

    // Detect organization change
    const currentOrgId = selectedOrganization.id;
    const isOrgChange = lastCheckedOrgRef.current && lastCheckedOrgRef.current !== currentOrgId;
    
    if (isOrgChange) {
      console.log('Enhanced Feature Access: Organization change detected', {
        from: lastCheckedOrgRef.current,
        to: currentOrgId
      });
      setIsOrgTransitioning(true);
      
      // Add a brief delay to prevent rapid successive calls
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      setIsLoading(true);
      setError(null);
      lastCheckedOrgRef.current = currentOrgId;

      console.log('Enhanced Feature Access: Checking access', { 
        featureKey, 
        orgId: currentOrgId,
        orgName: selectedOrganization.name
      });

      const { data, error } = await supabase.functions.invoke('check-feature-access', {
        body: {
          org_id: currentOrgId,
          feature_key: featureKey
        },
        signal
      });

      if (signal.aborted) {
        console.log('Enhanced Feature Access: Request aborted');
        return;
      }

      if (error) {
        console.error('Enhanced Feature Access: Error', error);
        setError(error.message || 'Failed to check feature access');
        setHasAccess(false);
        return;
      }

      const result = data as FeatureAccessResult;
      console.log('Enhanced Feature Access: Result', {
        hasAccess: result.has_access,
        reason: result.reason,
        orgId: currentOrgId
      });

      setHasAccess(result.has_access);
      setSubscriptionDetails(result.subscription_details);
      setGracePeriodInfo(result.grace_period_info);
      setUserRole(result.user_role || null);

      if (!result.has_access && result.reason) {
        console.log('Enhanced Feature Access: Access denied', result.reason);
      }

    } catch (err) {
      if (signal.aborted) {
        console.log('Enhanced Feature Access: Request aborted due to error');
        return;
      }
      
      console.error('Enhanced Feature Access: Exception', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setHasAccess(false);
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
        setIsOrgTransitioning(false);
      }
    }
  }, [user, selectedOrganization, featureKey, orgContextReady]);

  useEffect(() => {
    checkAccess();
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [checkAccess]);

  // Reset state when organization context is not ready
  useEffect(() => {
    if (!orgContextReady) {
      setIsLoading(true);
      setHasAccess(false);
      setError(null);
    }
  }, [orgContextReady]);

  return {
    hasAccess,
    isLoading,
    error,
    subscriptionDetails,
    gracePeriodInfo,
    userRole,
    checkAccess,
    isOrgTransitioning
  };
}
