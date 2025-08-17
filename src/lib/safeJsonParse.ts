/**
 * Safely parse JSON strings with optional logging control
 */
export function safeJsonParse<T>(
  jsonString: string, 
  fallback: T, 
  options: { silent?: boolean; context?: string } = {}
): T {
  const { silent = false, context = '' } = options;
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    if (!silent) {
      const contextMsg = context ? ` for ${context}` : '';
      console.warn(`Failed to parse JSON${contextMsg}:`, error);
    }
    return fallback;
  }
}