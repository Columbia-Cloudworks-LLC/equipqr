import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OrganizationSlot {
  id: string;
  organization_id: string;
  slot_type: string;
  purchased_slots: number;
  used_slots: number;
  billing_period_start: string;
  billing_period_end: string;
  stripe_payment_intent_id?: string;
  amount_paid_cents: number;
  created_at: string;
  updated_at: string;
}

export interface SlotPurchase {
  id: string;
  organization_id: string;
  purchased_by: string;
  slot_type: string;
  quantity: number;
  unit_price_cents: number;
  total_amount_cents: number;
  stripe_payment_intent_id?: string;
  stripe_session_id?: string;
  billing_period_start: string;
  billing_period_end: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface SlotAvailability {
  total_purchased: number;
  used_slots: number;
  available_slots: number;
  current_period_start: string;
  current_period_end: string;
}

export const useOrganizationSlots = (organizationId: string) => {
  return useQuery({
    queryKey: ['organization-slots', organizationId],
    queryFn: async (): Promise<OrganizationSlot[]> => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('organization_slots')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching organization slots:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useSlotAvailability = (organizationId: string) => {
  // Real-time subscriptions temporarily disabled to prevent subscription conflicts
  // TODO: Implement centralized subscription manager

  return useQuery({
    queryKey: ['slot-availability', organizationId],
    queryFn: async (): Promise<SlotAvailability> => {
      if (!organizationId) {
        return {
          total_purchased: 0,
          used_slots: 0,
          available_slots: 0,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date().toISOString()
        };
      }

      const { data, error } = await supabase.rpc('get_organization_slot_availability', {
        org_id: organizationId
      });

      if (error) {
        console.error('Error fetching slot availability:', error);
        throw error;
      }

      return data?.[0] || {
        total_purchased: 0,
        used_slots: 0,
        available_slots: 0,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date().toISOString()
      };
    },
    enabled: !!organizationId,
    staleTime: 10 * 1000, // 10 seconds
  });
};

export const useSlotPurchases = (organizationId: string) => {
  return useQuery({
    queryKey: ['slot-purchases', organizationId],
    queryFn: async (): Promise<SlotPurchase[]> => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('slot_purchases')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching slot purchases:', error);
        throw error;
      }

      // Cast the status to the proper type
      return (data || []).map(purchase => ({
        ...purchase,
        status: purchase.status as 'pending' | 'completed' | 'failed' | 'cancelled'
      }));
    },
    enabled: !!organizationId,
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useReserveSlot = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase.rpc('reserve_slot_for_invitation', {
        org_id: organizationId,
        invitation_id: invitationId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slot-availability', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-slots', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-invitations', organizationId] });
    },
    onError: (error) => {
      console.error('Error reserving slot:', error);
      toast.error('Failed to reserve slot for invitation');
    }
  });
};

export const useReleaseSlot = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase.rpc('release_reserved_slot', {
        org_id: organizationId,
        invitation_id: invitationId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slot-availability', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-slots', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-invitations', organizationId] });
    },
    onError: (error) => {
      console.error('Error releasing slot:', error);
      toast.error('Failed to release slot');
    }
  });
};
