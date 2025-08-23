
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isFeatureEnabled } from '@/config/features';
import { useOrganization } from './useOrganization';

export function useCustomersFeature() {
  const { currentOrganization } = useOrganization();
  
  const { data: orgFeatureEnabled = false } = useQuery({
    queryKey: ['organization-customers-feature', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return false;
      
      const { data, error } = await supabase
        .from('organizations')
        .select('customers_feature_enabled')
        .eq('id', currentOrganization.id)
        .single();
      
      if (error) {
        console.error('Failed to fetch customers feature flag:', error);
        return false;
      }
      
      return data?.customers_feature_enabled || false;
    },
    enabled: !!currentOrganization?.id,
  });

  // Feature is enabled if both the global flag AND the org flag are true
  const isEnabled = isFeatureEnabled('customers') && orgFeatureEnabled;
  
  return {
    isEnabled,
    isLoading: currentOrganization?.id ? false : true, // Simple loading state
  };
}
