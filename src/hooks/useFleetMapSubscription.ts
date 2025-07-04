import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FleetMapSubscription {
  enabled: boolean;
  status: 'active' | 'inactive' | 'cancelled';
  currentPeriodEnd?: string;
}

export const useFleetMapSubscription = (organizationId: string) => {
  return useQuery({
    queryKey: ['fleet-map-subscription', organizationId],
    queryFn: async (): Promise<FleetMapSubscription> => {
      if (!organizationId) {
        return { enabled: false, status: 'inactive' };
      }

      const { data, error } = await supabase
        .from('organization_subscriptions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('feature_type', 'fleet_map')
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error fetching fleet map subscription:', error);
        return { enabled: false, status: 'inactive' };
      }

      return {
        enabled: !!data,
        status: (data?.status as 'active' | 'inactive' | 'cancelled') || 'inactive',
        currentPeriodEnd: data?.current_period_end
      };
    },
    enabled: !!organizationId,
    staleTime: 60 * 1000, // 1 minute
  });
};