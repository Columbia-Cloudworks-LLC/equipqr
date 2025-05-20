
import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { validateInvitationToken } from '@/services/team/invitation/validateInvitation';
import { useOrganization } from '@/contexts/OrganizationContext';

/**
 * Hook for processing team invitations
 */
export function useTeamInvitation() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refreshOrganizations } = useOrganization();

  const acceptInvitation = async (token: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      console.log('Accepting team invitation');
      
      // First, validate the invitation token
      const { valid, invitation, error: validationError } = await validateInvitationToken(token);
      
      if (!valid || !invitation) {
        throw new Error(validationError || 'Invalid invitation token');
      }
      
      // Get current user session for acceptance
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        throw new Error('You must be logged in to accept an invitation');
      }
      
      // Add user to team with specified role
      const addResponse = await supabase.functions.invoke('add_team_member', {
        body: {
          _team_id: invitation.team_id,
          _user_id: sessionData.session.user.id,
          _role: invitation.role,
          _added_by: sessionData.session.user.id
        }
      });
      
      if (addResponse.error) {
        console.error('Error adding user to team:', addResponse.error);
        throw new Error(`Failed to add you to the team: ${addResponse.error.message}`);
      }
      
      // Get team's organization ID to add cross-org access
      const { data: team } = await supabase
        .from('team')
        .select('org_id')
        .eq('id', invitation.team_id)
        .single();
        
      if (team?.org_id) {
        // First check for existing ACL entry that might be temporary
        const { data: existingAcl } = await supabase
          .from('organization_acl')
          .select('id')
          .eq('org_id', team.org_id)
          .eq('subject_id', sessionData.session.user.id)
          .eq('subject_type', 'user')
          .maybeSingle();
          
        if (existingAcl?.id) {
          // Update existing ACL entry to remove expiration (make permanent)
          await supabase
            .from('organization_acl')
            .update({ expires_at: null })
            .eq('id', existingAcl.id);
            
          console.log('Updated existing organization access to permanent');
        } else {
          // Create a permanent ACL entry (no expiration)
          await supabase
            .from('organization_acl')
            .insert({
              org_id: team.org_id,
              subject_id: sessionData.session.user.id,
              subject_type: 'user',
              role: invitation.role === 'manager' ? 'manager' : 'viewer'
            });
            
          console.log('Added permanent organization access for user');
        }
      }
      
      // Mark the invitation as accepted
      await supabase
        .from('team_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);
        
      // Refresh organizations since team membership can affect org access
      console.log('Refreshing organizations after accepting team invitation');
      setTimeout(async () => {
        try {
          await refreshOrganizations();
          console.log('Organizations refreshed successfully after team invitation');
        } catch (refreshError) {
          console.error('Error refreshing organizations:', refreshError);
        }
      }, 1000);
      
      toast.success('Successfully joined the team');
      navigate('/teams');
      
      // Prepare result data
      const result = { 
        success: true,
        teamId: invitation.team_id,
        teamName: invitation.team?.name || "the team",
        role: invitation.role
      };
      
      return result;
    } catch (error: any) {
      console.error('Error accepting team invitation:', error);
      setError(error.message || 'Failed to accept invitation');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    acceptInvitation,
    isProcessing,
    error
  };
}
