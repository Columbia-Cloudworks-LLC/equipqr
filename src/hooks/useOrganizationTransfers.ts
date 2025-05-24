
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface OrganizationTransfer {
  id: string;
  org_id: string;
  from_user_id: string;
  status: string;
  initiated_at: string;
  expires_at: string;
  transfer_reason: string;
  organization: {
    name: string;
  };
  from_user: {
    display_name: string;
    email: string;
  };
}

export function useOrganizationTransfers() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<OrganizationTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTransfers();
    }
  }, [user]);

  const fetchTransfers = async () => {
    if (!user) return;

    try {
      // Get app_user ID first
      const { data: appUser, error: appUserError } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', user.id)
        .single();

      if (appUserError || !appUser) {
        console.error('Error fetching app user:', appUserError);
        return;
      }

      const { data, error } = await supabase
        .from('organization_transfers')
        .select(`
          id,
          org_id,
          from_user_id,
          status,
          initiated_at,
          expires_at,
          transfer_reason,
          organization:org_id(name)
        `)
        .eq('to_user_id', appUser.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      // Get from_user details separately to avoid relationship ambiguity
      const transfersWithUsers = await Promise.all(
        (data || []).map(async (transfer) => {
          const { data: fromUser, error: fromUserError } = await supabase
            .from('app_user')
            .select(`
              email,
              user_profiles!inner(display_name)
            `)
            .eq('id', transfer.from_user_id)
            .single();

          if (fromUserError) {
            console.error('Error fetching from user:', fromUserError);
            return {
              ...transfer,
              from_user: {
                display_name: 'Unknown User',
                email: 'unknown@example.com'
              }
            };
          }

          return {
            ...transfer,
            from_user: {
              display_name: fromUser?.user_profiles?.display_name || 'Unknown User',
              email: fromUser?.email || 'unknown@example.com'
            }
          };
        })
      );

      setTransfers(transfersWithUsers);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptTransfer = async (transferId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('transfer_organization', {
        body: {
          action: 'accept',
          transferId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Ownership transfer accepted successfully!');
        fetchTransfers();
        return true;
      }
    } catch (error) {
      console.error('Error accepting transfer:', error);
      toast.error(error.message || 'Failed to accept transfer');
      return false;
    }
  };

  const rejectTransfer = async (transferId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('transfer_organization', {
        body: {
          action: 'reject',
          transferId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Ownership transfer rejected');
        fetchTransfers();
        return true;
      }
    } catch (error) {
      console.error('Error rejecting transfer:', error);
      toast.error(error.message || 'Failed to reject transfer');
      return false;
    }
  };

  return {
    transfers,
    isLoading,
    acceptTransfer,
    rejectTransfer,
    refetch: fetchTransfers
  };
}
