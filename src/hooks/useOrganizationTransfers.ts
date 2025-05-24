
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
          *,
          organization:org_id(name),
          from_user:from_user_id(
            display_name:user_profiles!inner(display_name),
            email:app_user!inner(email)
          )
        `)
        .eq('to_user_id', appUser.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: OrganizationTransfer[] = (data || []).map(item => ({
        id: item.id,
        org_id: item.org_id,
        from_user_id: item.from_user_id,
        status: item.status,
        initiated_at: item.initiated_at,
        expires_at: item.expires_at,
        transfer_reason: item.transfer_reason,
        organization: {
          name: item.organization?.name || 'Unknown Organization'
        },
        from_user: {
          display_name: item.from_user?.display_name || 'Unknown User',
          email: item.from_user?.email || 'unknown@example.com'
        }
      }));
      
      setTransfers(transformedData);
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
