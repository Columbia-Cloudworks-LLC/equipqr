
import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { acceptOrganizationInvitation } from '@/services/organization/invitation/invitationAcceptance';

/**
 * Hook for processing organization invitations
 */
export function useOrganizationInvitation() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refreshOrganizations } = useOrganization();

  const acceptInvitation = async (token: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // For organization invitations, use our dedicated service function
      const acceptResult = await acceptOrganizationInvitation(token);
      
      if (!acceptResult.success) {
        throw new Error(acceptResult.error || 'Failed to accept organization invitation');
      }
      
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
      
      return acceptResult;
    } catch (error: any) {
      console.error('Error accepting organization invitation:', error);
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
