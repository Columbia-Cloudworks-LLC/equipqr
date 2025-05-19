
/**
 * Check if a string is a valid UUID
 * @param uuid String to check
 * @returns Boolean indicating if string is a valid UUID
 */
export function isValidUuid(uuid: any): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
