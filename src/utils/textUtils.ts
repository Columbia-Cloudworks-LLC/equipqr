
/**
 * Truncates a string to the specified length and adds an ellipsis if needed
 * 
 * @param text The string to truncate
 * @param maxLength The maximum length of the string
 * @returns The truncated string with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
}
