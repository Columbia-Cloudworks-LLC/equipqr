
/**
 * Validates the payload for the equipment permission check
 * Makes sure required fields are present and have valid formats
 */
export function validateEquipmentPermissionPayload(userId: string, teamId?: string | null): string | null {
  // Check if user_id is present
  if (!userId) {
    return "Missing required parameter: user_id";
  }
  
  // Validate UUID format for user_id (simplified regex check)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return "Invalid UUID format for user_id";
  }
  
  // If team_id is provided, validate it too (but it can be null/undefined)
  if (teamId && teamId !== 'none' && teamId !== 'null' && teamId !== '') {
    if (!uuidRegex.test(teamId)) {
      return "Invalid UUID format for team_id";
    }
  }
  
  // All checks passed
  return null;
}

/**
 * Validates the payload for team access checks
 */
export function validateTeamAccessPayload(userId: string, teamId: string): string | null {
  // Check if user_id is present
  if (!userId) {
    return "Missing required parameter: user_id";
  }
  
  // Check if team_id is present
  if (!teamId) {
    return "Missing required parameter: team_id";
  }
  
  // Validate UUID format for both IDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return "Invalid UUID format for user_id";
  }
  
  if (!uuidRegex.test(teamId)) {
    return "Invalid UUID format for team_id";
  }
  
  // All checks passed
  return null;
}
