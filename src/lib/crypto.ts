
/**
 * Crypto utility functions for generating secure tokens
 */

/**
 * Generates a cryptographically secure random token
 * @returns A unique token string
 */
export async function generateUniqueToken(): Promise<string> {
  // Create a secure random string using Web Crypto API
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  
  // Convert to base64 and make URL-safe
  const base64 = btoa(String.fromCharCode(...array));
  const urlSafe = base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
    
  return urlSafe;
}

/**
 * Generates a simple random token (less secure but works in all environments)
 * This is a fallback if the Web Crypto API is not available
 */
export function generateSimpleToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Update the organization/invitation/tokenService.ts to use our crypto utilities
 * for token generation
 */
export async function generateInvitationToken(): Promise<string> {
  try {
    return await generateUniqueToken();
  } catch (error) {
    console.error('Error generating secure token, falling back to simple token', error);
    return generateSimpleToken();
  }
}
