import { detectEnvironment, getEnvironmentConfig } from './environment';

/**
 * Enhanced application-wide configuration settings
 * This file centralizes all app configuration to improve maintainability
 * and enable easy deployment across different environments
 */

// Get environment configuration
const envConfig = getEnvironmentConfig();

// API and Service Configuration
export const ApiConfig = {
  supabase: {
    url: "https://oxeheowbfsshpyldlskb.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94ZWhlb3diZnNzaHB5bGRsc2tiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3OTY2MDUsImV4cCI6MjA2MjM3MjYwNX0.fTBztDcwSK57B7cMM20gF6xwto27zyzlbO-GypqNi4s",
    projectRef: "oxeheowbfsshpyldlskb"
  },
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2
  },
  requestTimeout: 30000
};

// UI and Theme Configuration
export const UIConfig = {
  theme: {
    defaultTheme: 'system' as const,
    storageKey: envConfig.storagePrefix + '-ui-theme' // Environment-aware theme storage
  },
  layout: {
    sidebarCollapsible: true,
    showBreadcrumbs: true,
    compactMode: false
  },
  animations: {
    enableAnimations: true,
    reducedMotion: false
  }
};

// Feature Flags and Business Logic
export const FeatureFlags = {
  fleetMap: {
    enabled: true,
    requiresSubscription: true
  },
  workOrders: {
    enabled: true,
    requiresSubscription: false
  },
  advancedReporting: {
    enabled: false,
    requiresSubscription: true
  },
  bulkOperations: {
    enabled: true,
    requiresSubscription: false
  },
  realTimeSync: {
    enabled: false,
    requiresSubscription: true
  }
};

// Data and Pagination Settings
export const DataConfig = {
  pagination: {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
    maxPageSize: 100
  },
  equipment: {
    maxImageSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxAttributesPerItem: 50
  },
  workNotes: {
    maxNoteLength: 5000,
    allowMarkdown: true,
    autoSave: true,
    autoSaveInterval: 30000 // 30 seconds
  }
};

// Security and Compliance Settings
export const SecurityConfig = {
  auth: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    enableMFA: false,
    passwordRequirements: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false
    },
    // Environment-aware settings
    enableDebugLogs: envConfig.enableDebugLogs,
    enableVerboseAuth: envConfig.enableVerboseAuth,
    sessionNamespace: envConfig.sessionNamespace
  },
  permissions: {
    strictRoleEnforcement: true,
    auditTrail: true,
    crossOrgAccess: false
  }
};

// Map Configuration
export const MapConfig = {
  defaultCenter: [-98.5, 39.8] as [number, number],
  defaultZoom: 4,
  maxZoom: 18,
  minZoom: 2,
  style: 'mapbox://styles/mapbox/light-v11',
  clustering: {
    enabled: true,
    maxZoom: 14,
    radius: 50
  },
  markers: {
    showPopups: true,
    animateToSelected: true
  }
};

// Application Metadata with Environment Information
export const AppConfig = {
  /**
   * Application version number
   * Update this value to change the version displayed throughout the application
   */
  version: 'v3.0',
  
  /**
   * Application name
   */
  name: 'EquipQR',
  
  /**
   * Application description
   */
  description: 'QR-based asset tracking system for fleet and office equipment management',
  
  /**
   * Environment information
   */
  environment: envConfig.environment,
  environmentConfig: envConfig,
  
  /**
   * Build information
   */
  build: {
    date: new Date().toISOString().split('T')[0],
    environment: envConfig.environment
  },
  
  /**
   * Contact and support information
   */
  support: {
    email: 'support@equipqr.com',
    website: 'https://equipqr.com',
    documentation: 'https://docs.equipqr.com'
  }
};

// Regional and Localization Settings
export const RegionalConfig = {
  defaultLocale: 'en-US',
  timezone: 'America/Chicago', // Texas timezone
  currency: 'USD',
  dateFormat: 'MM/dd/yyyy',
  timeFormat: '12h' as const,
  units: {
    distance: 'miles' as const,
    weight: 'lbs' as const,
    temperature: 'fahrenheit' as const
  }
};

// Export consolidated config for easy importing
export const Config = {
  app: AppConfig,
  api: ApiConfig,
  ui: UIConfig,
  features: FeatureFlags,
  data: DataConfig,
  security: SecurityConfig,
  map: MapConfig,
  regional: RegionalConfig,
  environment: envConfig
};

export default Config;
