
import { validateEnvironment, SUPABASE_CONFIG, SERVICE_CONFIG } from '@/config/environment';

/**
 * Validates the application environment and provides helpful error messages
 */
export function validateAppEnvironment(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required Supabase configuration
  const { isValid: supabaseValid, missingVars } = validateEnvironment();
  
  if (!supabaseValid) {
    errors.push(`Missing required Supabase environment variables: ${missingVars.join(', ')}`);
  }

  // Check optional service configurations
  if (!SERVICE_CONFIG.stripe.publishableKey) {
    warnings.push('Stripe publishable key not configured - billing features will not work');
  }

  if (!SERVICE_CONFIG.mapbox.accessToken) {
    warnings.push('Mapbox access token not configured - map features will not work');
  }

  // Validate Supabase URL format
  if (SUPABASE_CONFIG.url && !SUPABASE_CONFIG.url.match(/^https:\/\/[a-z0-9-]+\.supabase\.co$/)) {
    errors.push('Invalid Supabase URL format');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Log environment validation results
 */
export function logEnvironmentStatus(): void {
  const validation = validateAppEnvironment();
  
  if (validation.isValid) {
    console.log('✅ Environment validation passed');
  } else {
    console.error('❌ Environment validation failed:', validation.errors);
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️ Environment warnings:', validation.warnings);
  }
}
