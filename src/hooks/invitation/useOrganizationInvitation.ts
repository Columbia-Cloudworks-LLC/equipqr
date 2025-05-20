
import { useState } from 'react';
import { invokeEdgeFunction } from '@/utils/edgeFunctions';
import { toast } from 'sonner';

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
      
      // Call the edge function to accept the organization invitation using our improved edge function utility
      const data = await invokeEdgeFunction('accept_organization_invitation', { token });

      if (!data || data.error) {
        throw new Error(data?.error || 'Invalid response from server');
      }

      // Ensure we have a success flag in response
      if (!data.success) {
        throw new Error('Invitation acceptance failed');
      }

      toast.success('Organization invitation accepted successfully!');
      
      // Return the response data for further processing
      return data;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to accept organization invitation';
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
