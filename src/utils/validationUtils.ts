
/**
 * Validates if a string is a valid UUID
 * @param str The string to check
 * @returns True if the string is a valid UUID
 */
export function isValidUuid(str: string | null | undefined): boolean {
  if (!str) return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Validates if a value is a non-empty string
 * @param value The value to check
 * @returns True if the value is a non-empty string
 */
export function isNonEmptyString(value: any): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates if a value is a valid email address
 * @param email The email to validate
 * @returns True if the email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates if a numeric value is within a range
 * @param value The value to check
 * @param min The minimum allowed value
 * @param max The maximum allowed value
 * @returns True if the value is within range
 */
export function isNumberInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validates if a value is a valid date
 * @param date The date to validate
 * @returns True if the value is a valid date
 */
export function isValidDate(date: any): boolean {
  if (date instanceof Date) return !isNaN(date.getTime());
  if (typeof date === 'string') {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }
  return false;
}
