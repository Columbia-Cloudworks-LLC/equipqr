
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
      
      // Get the current session for auth token
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Explicitly use the session token with the edge function
      const data = await invokeEdgeFunctionWithRetry<InvitationResponse>('accept_organization_invitation', 
        { token }, 
        {
          maxRetries: 2,
          retryDelay: 1000,
          onRetry: (attempt) => {
            console.log(`Retrying invitation acceptance (attempt ${attempt})`);
          }
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

      toast.success('Organization invitation accepted successfully!');
      
      // Return the response data for further processing
      return data;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to accept organization invitation';
      console.error('Error in acceptInvitation:', error);
      setError(errorMsg);
      return { success: false, error: errorMsg };
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
