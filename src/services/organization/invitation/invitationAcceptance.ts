
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateOrganizationInvitation } from './invitationValidation';
import { InvitationResult } from './types';

// Track invitations being processed to prevent duplicates
const processingTokens: Set<string> = new Set();

/**
 * Accept an organization invitation with duplicate prevention
 */
export async function acceptOrganizationInvitation(token: string): Promise<InvitationResult> {
  // Check if this invitation is already being processed
  if (processingTokens.has(token)) {
    console.log(`Organization invitation ${token.substring(0, 8)}... is already being processed, skipping`);
    return { 
      success: false, 
      error: 'This invitation is currently being processed. Please wait.' 
    };
  }
  
  // Mark as processing
  processingTokens.add(token);
  
  try {
    console.log(`Accepting organization invitation with token: ${token.substring(0, 8)}...`);
    
    // First validate the invitation
    const { valid, invitation, error: validationError } = await validateOrganizationInvitation(token);
    
    if (!valid || !invitation) {
      console.error('Invalid invitation:', validationError);
      return { success: false, error: validationError || 'Invalid invitation' };
    }
    
    // Get current user session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return { 
        success: false, 
        error: 'Authentication error. Please try logging out and in again.' 
      };
    }
    
    if (!sessionData?.session?.user) {
      console.error('No authenticated session found');
      return { success: false, error: 'You must be logged in to accept an invitation' };
    }
    
    // Email validation - case insensitive comparison
    if (sessionData.session.user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      console.error('Email mismatch between session and invitation');
      return { 
        success: false, 
        error: `This invitation was sent to ${invitation.email}. You are currently logged in as ${sessionData.session.user.email}.`,
        message: `This invitation was sent to ${invitation.email}. You are currently logged in as ${sessionData.session.user.email}.` 
      };
    }
    
    try {
      // Directly handle organization invitation acceptance
      // First check if user already has a role in the organization
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id, role')
        .eq('org_id', invitation.org_id)
        .eq('user_id', sessionData.session.user.id)
        .maybeSingle();
        
      if (existingRole?.id) {
        console.log(`User is already a member of this organization with role: ${existingRole.role}`);
        
        // Update the invitation status
        await supabase
          .from('organization_invitations')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString()
          })
          .eq('id', invitation.id);
          
        return { 
          success: true, 
          message: 'You are already a member of this organization',
          data: {
            organization: invitation.organization,
            role: invitation.role
          }
        };
      }
      
      // Add user to organization
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: sessionData.session.user.id,
          org_id: invitation.org_id,
          role: invitation.role,
          assigned_by: invitation.created_by || sessionData.session.user.id // Use created_by or fall back to current user
        });
        
      if (roleError) {
        throw new Error(`Failed to assign role: ${roleError.message}`);
      }
      
      // Check user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', sessionData.session.user.id)
        .maybeSingle();
        
      // Update profile if it doesn't have an org_id
      if (profile && !profile.org_id) {
        await supabase
          .from('user_profiles')
          .update({ org_id: invitation.org_id })
          .eq('id', sessionData.session.user.id);
      }
      
      // Mark invitation as accepted
      await supabase
        .from('organization_invitations')
        .update({ 
          status: 'accepted', 
          accepted_at: new Date().toISOString() 
        })
        .eq('id', invitation.id);
      
      return {
        success: true,
        data: {
          organization: invitation.organization,
          role: invitation.role
        }
      };
    } catch (error: any) {
      console.error('Error processing organization invitation:', error);
      throw error;
    }
    
  } catch (error: any) {
    console.error('Error in acceptOrganizationInvitation:', error);
    return { success: false, error: error.message || 'Failed to accept invitation' };
  } finally {
    // Remove from processing set after a delay to prevent immediate retries
    setTimeout(() => {
      processingTokens.delete(token);
    }, 5000);
  }
}
