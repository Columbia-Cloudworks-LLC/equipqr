
import { supabase } from "@/integrations/supabase/client";
import { isValidUuid } from "@/utils/validationUtils";
import { EdgePermissionResponse, PermissionResult } from "./types";

/**
 * Check if the user has permission to create equipment using the edge function
 */
export const checkCreatePermission = async (
  authUserId: string,
  teamId?: string | null
): Promise<PermissionResult> => {
  try {
    // Validate UUID format for user_id
    if (!isValidUuid(authUserId)) {
      console.error(`Invalid UUID format for authUserId: ${authUserId}`);
      throw new Error('Invalid user ID format');
    }

    // Validate team_id if provided
    if (teamId && teamId !== 'none' && !isValidUuid(teamId)) {
      console.error(`Invalid UUID format for teamId: ${teamId}`);
      throw new Error('Invalid team ID format');
    }

    // Normalize team_id to null if it's 'none' or empty string
    const normalizedTeamId = teamId === 'none' || teamId === '' ? null : teamId;

    // Log the full payload being sent to the edge function
    console.log('Sending payload to create_equipment_permission:', {
      user_id: authUserId,
      team_id: normalizedTeamId
    });

    // Call the edge function
    const { data, error } = await supabase.functions.invoke(
      'create_equipment_permission',
      {
        method: 'POST',
        body: {
          user_id: authUserId,
          team_id: normalizedTeamId
        },
      }
    );

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`Permission check failed: ${error.message}`);
    }

    if (!data) {
      console.error('No data returned from edge function');
      throw new Error('Permission check failed: No data returned');
    }

    console.log('Edge function response:', data);

    return {
      canCreate: data.can_create === true,
      orgId: data.org_id,
      reason: data.reason
    };
  } catch (error: any) {
    console.error('Error checking permission:', error);
    throw error;
  }
};
