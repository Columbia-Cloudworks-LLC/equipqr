
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateOrganizationInvitation } from './invitationValidation';
import { InvitationResult } from './types';
import { invokeEdgeFunctionWithRetry } from '@/utils/edgeFunctionUtils';

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
    
    // Add detailed logging
    console.log('Session found with user:', {
      email: sessionData.session.user.email,
      id: sessionData.session.user.id
    });
    console.log('Invitation is for:', invitation.email);
    
    // Email validation - case insensitive comparison
    if (sessionData.session.user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      console.error('Email mismatch between session and invitation');
      return { 
        success: false, 
        error: `This invitation was sent to ${invitation.email}. You are currently logged in as ${sessionData.session.user.email}.` 
      };
    }
    
    // Call the edge function to accept the invitation using our retry utility
    const data = await invokeEdgeFunctionWithRetry('accept_organization_invitation', { token }, {
      maxRetries: 2,
      timeoutMs: 12000,
      onRetry: (attempt, error) => {
        console.warn(`Retry attempt ${attempt} for accept_organization_invitation:`, error);
      }
    });
    
    // Check for errors in the response
    if (!data?.success) {
      console.error('Error in accept_organization_invitation:', data?.error);
      return { success: false, error: data?.error || 'Unknown error accepting invitation' };
    }
    
    // Log successful acceptance
    console.log('Organization invitation accepted successfully:', data);
    
    return {
      success: true,
      data: {
        organization: data.data.organization,
        role: data.data.role
      }
    };
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
