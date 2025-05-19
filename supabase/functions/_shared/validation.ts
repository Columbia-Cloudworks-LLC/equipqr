
/**
 * Validation utilities for edge functions
 */

/**
 * Check if a string is a valid UUID
 */
export function isValidUuid(uuid: string | null | undefined): boolean {
  if (uuid === null || uuid === undefined) {
    return false;
  }
  
  if (typeof uuid !== 'string') {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates the equipment permission payload
 * @returns Error message or null if valid
 */
export function validateEquipmentPermissionPayload(user_id: any, team_id: any): string | null {
  console.log(`Validating payload: user_id=${user_id} (${typeof user_id}), team_id=${team_id || 'null'} (${typeof team_id})`);
  
  // Check required parameters
  if (!user_id) {
    return "Missing required parameter: user_id";
  }
  
  // Validate UUID format for user_id
  if (!isValidUuid(user_id)) {
    return `Invalid UUID format for user_id: ${user_id}`;
  }
  
  // Handle team_id nulls and validate format if provided
  if (team_id === 'null' || team_id === 'none' || team_id === '') {
    // This is fine, will be normalized to null
    return null;
  } else if (team_id !== null && team_id !== undefined && !isValidUuid(team_id)) {
    return `Invalid UUID format for team_id: ${team_id}`;
  }
  
  return null;
}
