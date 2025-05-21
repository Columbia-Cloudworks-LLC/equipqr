
import { UserRole } from '@/types/supabase-enums';
import { createOrganizationInvitation } from './invitationCreation';

/**
 * Invites a user to join an organization with a specific role
 */
export async function inviteToOrganization(
  email: string,
  role: UserRole,
  organizationId: string
) {
  try {
    return await createOrganizationInvitation(email, organizationId, role);
  } catch (error: any) {
    console.error('Error in inviteToOrganization:', error);
    return {
      success: false,
      error: error.message || 'Error sending invitation'
    };
  }
}
