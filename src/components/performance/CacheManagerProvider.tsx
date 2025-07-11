import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cacheManager } from '@/services/cacheManager';
import { backgroundSync } from '@/services/backgroundSync';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';

// PHASE 3: Cache management provider with automatic setup
interface CacheManagerContextType {
  getCacheStats: () => any;
  clearCache: (pattern?: string) => void;
  getSyncStatus: () => any;
}

const CacheManagerContext = createContext<CacheManagerContextType | undefined>(undefined);

interface CacheManagerProviderProps {
  children: ReactNode;
}

export const CacheManagerProvider: React.FC<CacheManagerProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  // Initialize cache manager and background sync
  useEffect(() => {
    cacheManager.setQueryClient(queryClient);
  }, [queryClient]);

  // Setup background sync for current organization
  useEffect(() => {
    if (currentOrganization?.id && user) {
      // Subscribe to real-time updates
      backgroundSync.subscribeToOrganization(currentOrganization.id);
      
      // Start periodic sync for critical data
      backgroundSync.startPeriodicSync(currentOrganization.id);

      return () => {
        // Cleanup on organization change
        backgroundSync.unsubscribeFromOrganization(currentOrganization.id);
      };
    }
  }, [currentOrganization?.id, user]);

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      backgroundSync.cleanup();
    };
  }, []);

  const getCacheStats = () => {
    return cacheManager.getCacheStats();
  };

  const clearCache = (pattern?: string) => {
    cacheManager.clearCache(pattern);
  };

  const getSyncStatus = () => {
    return backgroundSync.getSyncStatus();
  };

  const value = {
    getCacheStats,
    clearCache,
    getSyncStatus
  };

  return (
    <CacheManagerContext.Provider value={value}>
      {children}
    </CacheManagerContext.Provider>
  );
};

export const useCacheManagerContext = () => {
  const context = useContext(CacheManagerContext);
  if (context === undefined) {
    throw new Error('useCacheManagerContext must be used within a CacheManagerProvider');
  }
  return context;
};