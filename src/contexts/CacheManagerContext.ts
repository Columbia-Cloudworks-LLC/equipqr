import { createContext } from 'react';
import { CacheStats, SyncStatus } from '@/types/cacheManagerTypes';

export interface CacheManagerContextType {
  getCacheStats: () => CacheStats;
  clearCache: () => void;
  getSyncStatus: () => SyncStatus;
}

export const CacheManagerContext = createContext<CacheManagerContextType | undefined>(undefined);