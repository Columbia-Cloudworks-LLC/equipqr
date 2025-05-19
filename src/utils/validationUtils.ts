
/**
 * Validation utilities for the equipqr application
 */

/**
 * Check if a string is a valid UUID
 * @param str String to check
 * @returns Boolean indicating if string is a valid UUID
 */
export function isValidUuid(str: string): boolean {
  if (!str) return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Check if a value is a valid date
 * @param value Value to check
 * @returns Boolean indicating if value can be parsed as a date
 */
export function isValidDate(value: any): boolean {
  if (!value) return false;
  
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Safely parse a date string
 * @param value Date string to parse
 * @param defaultValue Default value if parsing fails
 * @returns Date object or default value
 */
export function safeParseDate(value: string | null | undefined, defaultValue: Date | null = null): Date | null {
  if (!value) return defaultValue;
  
  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? defaultValue : date;
  } catch (e) {
    return defaultValue;
  }
}
