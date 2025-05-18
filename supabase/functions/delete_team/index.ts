
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createAdminClient } from './adminClient.ts';
import { corsHeaders, createSuccessResponse, createErrorResponse } from './cors.ts';
import { TeamDeletionValidator } from './teamDeletionValidator.ts';
import { TeamDeletionService } from './teamDeletionService.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Set a reasonable timeout for the function execution
    const timeout = setTimeout(() => {
      console.error("Function timed out");
      throw new Error('Function execution timed out after 8 seconds');
    }, 8000); // 8 seconds max execution time
    
    try {
      // Parse request body and validate required fields
      const requestBody = await req.json().catch((e) => {
        console.error("Error parsing request body:", e);
        return {};
      });
      
      const { teamId, userId } = requestBody;
      
      if (!teamId) {
        console.error("Missing required parameter: teamId");
        return createErrorResponse('Team ID is required', 400);
      }
      
      if (!userId) {
        console.error("Missing required parameter: userId");
        return createErrorResponse('User ID is required', 400);
      }

      console.log(`Processing delete request for team: ${teamId} by user: ${userId}`);
      const supabase = createAdminClient();
      
      // Step 1: Validate permission to delete the team
      const validator = new TeamDeletionValidator(supabase);
      const validationResult = await validator.validatePermission(userId, teamId);
      
      if (!validationResult.hasPermission) {
        console.error(`Permission validation failed: ${validationResult.message}`);
        return createErrorResponse(
          validationResult.message || 'You do not have permission to delete this team',
          403
        );
      }
      
      console.log("Permission validation successful:", validationResult);
      
      // Step 2: Create deletion service and perform deletion steps
      const deletionService = new TeamDeletionService(supabase);
      
      // Get equipment count before deletion
      const equipmentCount = await deletionService.getEquipmentCount(teamId);
      console.log(`Found ${equipmentCount} equipment records to update`);
      
      // Update equipment records
      const equipmentUpdated = await deletionService.updateEquipmentRecords(teamId);
      if (!equipmentUpdated) {
        console.error("Failed to update equipment records");
        return createErrorResponse('Failed to update equipment records', 500);
      }
      
      // Delete team roles first (to avoid foreign key constraints)
      const rolesDeleted = await deletionService.deleteTeamRoles(teamId);
      if (!rolesDeleted) {
        console.warn("Failed to remove team roles, but continuing with deletion");
      }
      
      // Delete team members
      const membersDeleted = await deletionService.deleteTeamMembers(teamId);
      if (!membersDeleted) {
        console.error("Failed to remove team members");
        return createErrorResponse('Failed to remove team members', 500);
      }
      
      // Cancel pending invitations
      const invitationsCancelled = await deletionService.cancelTeamInvitations(teamId);
      if (!invitationsCancelled) {
        console.warn("Failed to cancel team invitations, but continuing with deletion");
      }
      
      // Finally, delete the team
      const teamDeleted = await deletionService.deleteTeam(teamId);
      if (!teamDeleted) {
        console.error("Failed to delete team");
        return createErrorResponse('Failed to delete team', 500);
      }
      
      console.log(`Team ${teamId} deleted successfully`);
      
      return createSuccessResponse({
        success: true,
        message: 'Team deleted successfully',
        equipmentUpdated: equipmentCount
      });
      
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error('Unexpected error in delete_team function:', error);
    return createErrorResponse(`Server error: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
});
