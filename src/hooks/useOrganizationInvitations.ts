import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OrganizationInvitation {
  id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  inviterName?: string;
  slot_reserved?: boolean;
  slot_purchase_id?: string;
  declined_at?: string;
  expired_at?: string;
}

export interface CreateInvitationData {
  email: string;
  role: 'admin' | 'member';
  message?: string;
  reserveSlot?: boolean;
}

export const useOrganizationInvitations = (organizationId: string) => {
  return useQuery({
    queryKey: ['organization-invitations', organizationId],
    queryFn: async (): Promise<OrganizationInvitation[]> => {
      if (!organizationId) return [];

      // First get the invitations
      const { data: invitationsData, error } = await supabase
        .from('organization_invitations')
        .select(`
          id,
          email,
          role,
          status,
          message,
          invited_by,
          created_at,
          expires_at,
          accepted_at,
          slot_reserved,
          slot_purchase_id,
          declined_at,
          expired_at
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations:', error);
        throw error;
      }

      // Get inviter names separately
      const inviterIds = [...new Set(invitationsData?.map(inv => inv.invited_by).filter(Boolean))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', inviterIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p.name]) || []);

      return (invitationsData || []).map(invitation => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role as 'admin' | 'member',
        status: invitation.status as 'pending' | 'accepted' | 'declined' | 'expired',
        message: invitation.message || undefined,
        invitedBy: invitation.invited_by,
        createdAt: invitation.created_at,
        expiresAt: invitation.expires_at,
        acceptedAt: invitation.accepted_at || undefined,
        inviterName: profilesMap.get(invitation.invited_by) || 'Unknown',
        slot_reserved: invitation.slot_reserved || false,
        slot_purchase_id: invitation.slot_purchase_id || undefined,
        declined_at: invitation.declined_at || undefined,
        expired_at: invitation.expired_at || undefined
      }));
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Retry utility with exponential backoff
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry certain types of errors
      if (
        error.code === '23505' || // Unique constraint violation
        error.code === '42501' || // Insufficient privilege
        error.message?.includes('not authenticated')
      ) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        console.error(`Operation failed after ${maxRetries + 1} attempts:`, error);
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Client-side permission validation
const validateInvitationPermissions = async (organizationId: string): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return false;

    // Check if user is admin of the organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .single();

    return membership?.role === 'owner' || membership?.role === 'admin';
  } catch (error) {
    console.error('Permission validation failed:', error);
    return false;
  }
};

export const useCreateInvitation = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestData: CreateInvitationData) => {
      if (!organizationId) throw new Error('No organization ID provided');

      // Client-side permission validation
      const hasPermission = await validateInvitationPermissions(organizationId);
      if (!hasPermission) {
        throw new Error('You do not have permission to invite members to this organization');
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      // Log the invitation attempt
      console.log(`[INVITATION] Creating invitation for ${requestData.email} in org ${organizationId}`);

      return await retryWithBackoff(async () => {
        // Get current user profile for inviter name
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', userData.user.id)
          .single();

        // Get organization name
        const { data: organization } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', organizationId)
          .single();

        // Create invitation using the direct function to avoid circular dependencies
        const startTime = performance.now();
        const { data: invitationId, error } = await supabase.rpc('create_invitation_direct', {
          p_organization_id: organizationId,
          p_email: requestData.email.toLowerCase().trim(),
          p_role: requestData.role,
          p_message: requestData.message || null,
          p_invited_by: userData.user.id
        });

        const dbTime = performance.now() - startTime;
        console.log(`[INVITATION] Direct creation took ${dbTime.toFixed(2)}ms`);

        if (error) {
          console.error(`[INVITATION] Safe creation error:`, error);
          throw error;
        }

        // Get the created invitation data for return
        const { data: createdInvitation, error: fetchError } = await supabase
          .from('organization_invitations')
          .select('*')
          .eq('id', invitationId)
          .single();

        if (fetchError) {
          console.error(`[INVITATION] Fetch created invitation error:`, fetchError);
          throw fetchError;
        }

        // Reserve slot if requested and available
        if (requestData.reserveSlot) {
          try {
            const { error: reserveError } = await supabase.rpc('reserve_slot_for_invitation', {
              org_id: organizationId,
              invitation_id: createdInvitation.id
            });

            if (reserveError) {
              console.warn('[INVITATION] Failed to reserve slot:', reserveError);
              // Don't throw here - invitation was created successfully
            }
          } catch (reserveError) {
            console.warn('[INVITATION] Slot reservation error:', reserveError);
          }
        }

        // Send invitation email via edge function (non-blocking)
        setTimeout(async () => {
          try {
            const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
              body: {
                invitationId: createdInvitation.id,
                email: requestData.email.toLowerCase().trim(),
                role: requestData.role,
                organizationName: organization?.name || 'Your Organization',
                inviterName: profile?.name || 'Team Member',
                message: requestData.message
              }
            });

            if (emailError) {
              console.error('[INVITATION] Failed to send invitation email:', emailError);
            } else {
              console.log(`[INVITATION] Email sent successfully for ${requestData.email}`);
            }
          } catch (emailError) {
            console.error('[INVITATION] Error calling email function:', emailError);
          }
        }, 0);

        console.log(`[INVITATION] Successfully created invitation ${createdInvitation.id} for ${requestData.email}`);
        return createdInvitation;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-invitations', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['slot-availability', organizationId] });
      toast.success('Invitation sent successfully');
    },
    onError: (error: any) => {
      console.error('Error creating invitation:', error);
      if (error.code === '23505') {
        toast.error('An invitation to this email already exists');
      } else {
        toast.error('Failed to send invitation');
      }
    }
  });
};

export const useResendInvitation = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase
        .from('organization_invitations')
        .update({
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          status: 'pending'
        })
        .eq('id', invitationId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-invitations', organizationId] });
      toast.success('Invitation resent successfully');
    },
    onError: (error) => {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation');
    }
  });
};

export const useCancelInvitation = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase
        .from('organization_invitations')
        .update({ status: 'expired' })
        .eq('id', invitationId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-invitations', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['slot-availability', organizationId] });
      toast.success('Invitation cancelled successfully');
    },
    onError: (error) => {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    }
  });
};

// Direct invitation creation utility
export const createInvitationDirectly = async (
  organizationId: string,
  email: string,
  role: 'admin' | 'member',
  message?: string
): Promise<string> => {
  const { data: invitationId, error } = await supabase.rpc('create_invitation_direct', {
    p_organization_id: organizationId,
    p_email: email.toLowerCase().trim(),
    p_role: role,
    p_message: message || null
  });

  if (error) {
    throw new Error(`Failed to create invitation: ${error.message}`);
  }

  return invitationId;
};
