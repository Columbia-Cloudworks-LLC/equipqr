
import { useState } from 'react';
import { invokeEdgeFunctionWithRetry } from '@/utils/edgeFunctions/core';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Define the response type from the edge function
interface InvitationResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    organization?: {
      id: string;
      name: string;
    };
    role?: string;
  };
}

export function useOrganizationInvitation() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptInvitation = async (token: string) => {
    if (!token) {
      const errorMsg = 'No invitation token provided';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      setIsProcessing(true);
      setError(null);

      console.log('Accepting organization invitation with token:', token.substring(0, 8) + '...');
      
      // Force refresh the session to ensure we have the most up-to-date token
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Error refreshing session:', refreshError);
        throw new Error('Authentication error. Please try logging out and in again.');
      } 
      
      if (!refreshData?.session?.access_token) {
        console.error('No access token after refresh');
        throw new Error('Authentication required. Please log in again.');
      }
      
      // The session refresh was successful
      console.log('Session refreshed successfully');
      console.log(`Using auth token: ${refreshData.session.access_token.substring(0, 10)}...`);
      
      // Use the fresh access token with the edge function
      const data = await invokeEdgeFunctionWithRetry<InvitationResponse>('accept_organization_invitation', 
        { token }, 
        {
          maxRetries: 2,
          retryDelay: 1000,
          onRetry: (attempt) => {
            console.log(`Retrying invitation acceptance (attempt ${attempt})`);
          },
          authToken: refreshData.session.access_token // Use the fresh token
        }
      );

      if (!data || data.error) {
        console.error('Error from edge function:', data?.error);
        throw new Error(data?.error || 'Invalid response from server');
      }

      // Ensure we have a success flag in response
      if (!data.success) {
        console.error('Invitation acceptance failed:', data);
        throw new Error(data.message || 'Invitation acceptance failed');
      }

      // FIXED: Explicitly dismiss the invitation notification
      try {
        // Force a refresh of notifications after accepting invitation
        await supabase.rpc('dismiss_notification', {
          notification_type: 'organization_invitation',
          reference_id: token 
        });
      } catch (dismissError) {
        console.warn('Could not dismiss notification:', dismissError);
        // Continue execution even if dismissal fails
      }

      toast.success('Organization invitation accepted successfully!');
      
      // Return the response data for further processing
      return data;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to accept organization invitation';
      console.error('Error in acceptInvitation:', error);
      setError(errorMsg);
      
      // Return a more detailed error object for better debugging
      return { 
        success: false, 
        error: errorMsg,
        details: error.toString(),
        name: error.name,
        status: error.status
      };
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
