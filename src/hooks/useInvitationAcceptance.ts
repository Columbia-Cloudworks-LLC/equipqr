
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { invokeEdgeFunctionWithRetry } from '@/utils/edgeFunctionUtils';
import { useAuth } from '@/contexts/AuthContext';
import { acceptOrganizationInvitation } from '@/services/organization/invitation/invitationAcceptance';

// Track invitations being processed to prevent duplicate attempts
const processingInvitations: Record<string, boolean> = {};

export function useInvitationAcceptance() {
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refreshOrganizations } = useOrganization();
  const { session, checkSession } = useAuth();

  // Ensure we have valid session before proceeding
  useEffect(() => {
    const validateSession = async () => {
      await checkSession();
    };
    
    validateSession();
  }, [checkSession]);

  // Wait for session to be valid before accepting invitations
  const ensureValidSession = async (): Promise<boolean> => {
    // Check if we already have a valid session
    if (session?.user) {
      return true;
    }
    
    // Otherwise, explicitly check session status
    console.log("Ensuring valid session before proceeding with invitation acceptance");
    const isValid = await checkSession();
    
    if (!isValid) {
      console.error("No valid session available for invitation acceptance");
      throw new Error('Authentication required. Please login and try again.');
    }
    
    // Double check we have a session now
    const { data: sessionData } = await supabase.auth.getSession();
    return !!sessionData?.session;
  };

  const acceptInvitation = async (token: string, type?: string): Promise<any> => {
    // Prevent duplicate processing of the same invitation
    if (processingInvitations[token]) {
      console.log(`Invitation ${token.substring(0, 8)}... is already being processed, skipping`);
      return null;
    }
    
    try {
      // Mark as processing
      processingInvitations[token] = true;
      setIsAccepting(true);
      setAcceptError(null);
      let result = null;

      // Verify we have a valid session before proceeding
      const hasSession = await ensureValidSession();
      if (!hasSession) {
        throw new Error('No authenticated session found. Please login and try again.');
      }

      // Log the invitation type and token for debugging
      console.log(`Accepting invitation with token: ${token.substring(0, 8)}... (Type: ${type || 'team'})`);
      console.log('Current auth state:', { 
        hasSession: !!session,
        email: session?.user?.email, 
        authTime: session?.user?.last_sign_in_at
      });
      
      // Normalize invitation type to ensure consistent handling
      const invitationType = type === 'organization' ? 'organization' : 'team';
      
      try {
        if (invitationType === 'organization') {
          // For organization invitations, use our dedicated service function
          const acceptResult = await acceptOrganizationInvitation(token);
          
          if (!acceptResult.success) {
            throw new Error(acceptResult.error || 'Failed to accept organization invitation');
          }
          
          result = acceptResult;
          
          // Force refresh organizations in context with delay to ensure DB changes are available
          console.log('Refreshing organizations after accepting org invitation');
          setTimeout(async () => {
            try {
              await refreshOrganizations();
              console.log('Organizations refreshed successfully');
            } catch (refreshError) {
              console.error('Error refreshing organizations:', refreshError);
            }
          }, 1000);
          
          toast.success('Successfully joined the organization');
          
          // Redirect to organization settings
          navigate('/organization');
        } else {
          // Team invitation acceptance logic
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
            
          // Prepare result data
          result = { 
            success: true,
            teamId: invitation.team_id,
            teamName: invitation.team?.name || "the team",
            role: invitation.role
          };
          
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
        }
      } catch (error: any) {
        console.error('Error during invitation acceptance:', error);
        throw error;
      }
      
      return result;
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      const errorMessage = error.message || 'Failed to accept invitation';
      setAcceptError(errorMessage);
      toast.error(`Failed to accept invitation: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setIsAccepting(false);
      
      // Clear processing state after a delay to prevent immediate retries
      setTimeout(() => {
        delete processingInvitations[token];
      }, 5000);
    }
  };

  return {
    acceptInvitation,
    isAccepting,
    acceptError
  };
}

export default useInvitationAcceptance;
