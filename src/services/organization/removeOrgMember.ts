
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RemoveOrgMemberResult {
  success: boolean;
  message?: string;
  teamsRemoved?: number;
  error?: string;
}

/**
 * Removes a member from an organization and all associated teams
 */
export async function removeOrganizationMember(
  organizationId: string,
  userId: string
): Promise<RemoveOrgMemberResult> {
  try {
    console.log(`Attempting to remove user ${userId} from organization ${organizationId}`);
    
    if (!organizationId || !userId) {
      return {
        success: false,
        error: 'Missing organization ID or user ID'
      };
    }

    const { data, error } = await supabase.functions.invoke('remove_org_member', {
      body: {
        org_id: organizationId,
        user_id: userId
      }
    });

    if (error) {
      console.error('Error removing organization member:', error);
      return {
        success: false,
        error: error.message || 'Failed to communicate with server'
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'No response from server'
      };
    }

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Failed to remove organization member'
      };
    }

    console.log('Organization member removed successfully:', data);
    
    return {
      success: true,
      message: data.message,
      teamsRemoved: data.teams_removed
    };
  } catch (error) {
    console.error('Error in removeOrganizationMember:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      success: false,
      error: errorMessage
    };
  }
}
