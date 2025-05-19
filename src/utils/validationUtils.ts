
/**
 * Validates if a string is a valid UUID
 */
export function isValidUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Safely parses a value that might be a UUID
 * Returns the value if it's a valid UUID, otherwise returns null
 */
export function parseUuid(value: string | null | undefined): string | null {
  if (!value) return null;
  return isValidUuid(value) ? value : null;
}
