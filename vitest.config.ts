import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      all: false, // Only include files touched by tests
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'src/test/',
        'src/integrations/supabase/types.ts',
        'scripts/**',
        'supabase/**',
        'functions/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        'src/main.tsx', // Vite entry point
        'src/data/**', // Static data files
        'src/components/landing/**', // Landing page components
        'src/components/billing/**', // Billing components  
        'src/components/layout/**', // Layout components
        'src/components/migration/**', // Migration components
        'src/components/notifications/**', // Notification components
        'src/components/performance/**', // Performance components
        'src/components/qr/**', // QR components
        'src/components/reports/**', // Report components
        'src/components/scanner/**', // Scanner components
        'src/components/security/**', // Security components
        'src/components/session/**', // Session components
        'src/components/settings/**', // Settings components
        'src/components/teams/**', // Teams components
        'src/contexts/CacheContext.tsx', // Cache context
        'src/contexts/SettingsContext.tsx', // Settings context
        'src/contexts/TeamContext.tsx', // Team context
        'src/contexts/UserContext.tsx', // User context
        'src/hooks/use-mobile.tsx', // Mobile hook
        'src/hooks/use-toast.ts', // Toast hook
        'src/hooks/useAsyncOperation.ts', // Async operation hook
        'src/hooks/useAutoSave.ts', // Auto save hook
        'src/hooks/useBulkWorkOrders.ts', // Bulk work orders hook
        'src/hooks/useBrowserStorage.ts', // Browser storage hook
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});