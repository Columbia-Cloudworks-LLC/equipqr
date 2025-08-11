import { useContext } from 'react';
import { CacheManagerContext } from '@/contexts/CacheManagerContext';

export const useCacheManagerContext = () => {
  const context = useContext(CacheManagerContext);
  if (context === undefined) {
    throw new Error('useCacheManagerContext must be used within a CacheManagerProvider');
  }
  return context;
};