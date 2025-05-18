
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
    const { teamId, userId } = await req.json();
    
    if (!teamId) {
      return createErrorResponse('Team ID is required', 400);
    }
    
    if (!userId) {
      return createErrorResponse('User ID is required', 400);
    }

    console.log(`Processing delete request for team: ${teamId} by user: ${userId}`);
    const supabase = createAdminClient();
    
    // Step 1: Validate permission to delete the team
    const validator = new TeamDeletionValidator(supabase);
    const validationResult = await validator.validatePermission(userId, teamId);
    
    if (!validationResult.hasPermission) {
      return createErrorResponse(
        validationResult.message || 'You do not have permission to delete this team',
        403
      );
    }
    
    // Step 2: Create deletion service and perform deletion steps
    const deletionService = new TeamDeletionService(supabase);
    
    // Get equipment count before deletion
    const equipmentCount = await deletionService.getEquipmentCount(teamId);
    console.log(`Found ${equipmentCount} equipment records to update`);
    
    // Update equipment records
    const equipmentUpdated = await deletionService.updateEquipmentRecords(teamId);
    if (!equipmentUpdated) {
      return createErrorResponse('Failed to update equipment records', 500);
    }
    
    // Delete team members
    const membersDeleted = await deletionService.deleteTeamMembers(teamId);
    if (!membersDeleted) {
      return createErrorResponse('Failed to remove team members', 500);
    }
    
    // Delete team roles - continue even if it fails
    await deletionService.deleteTeamRoles(teamId);
    
    // Cancel pending invitations - continue even if it fails
    await deletionService.cancelTeamInvitations(teamId);
    
    // Finally, delete the team
    const teamDeleted = await deletionService.deleteTeam(teamId);
    if (!teamDeleted) {
      return createErrorResponse('Failed to delete team', 500);
    }
    
    return createSuccessResponse({
      success: true,
      message: 'Team deleted successfully',
      equipmentUpdated: equipmentCount
    });
    
  } catch (error) {
    console.error('Unexpected error in delete_team function:', error);
    return createErrorResponse(`Server error: ${error.message}`, 500);
  }
});
